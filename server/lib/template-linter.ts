export interface TemplateLintResult {
  score: number;
  warnings: string[];
  suggestions: string[];
}

const SPAM_WORDS = [
  "FREE", "CLICK HERE", "WINNER", "CONGRATULATIONS", "URGENT",
  "ACT NOW", "LIMITED TIME", "GUARANTEED", "NO OBLIGATION",
  "RISK FREE", "CASH BONUS", "MILLION DOLLARS"
];

const SPAM_PATTERNS = [
  { pattern: /!!!+/, message: "Multiple exclamation marks" },
  { pattern: /\$\$\$/, message: "Multiple dollar signs" },
  { pattern: /[A-Z]{10,}/, message: "Excessive use of capital letters" },
];

export function lintTemplate(subject: string, body: string = "", html: string = ""): TemplateLintResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const fullText = `${subject} ${body}`;

  if (subject.toUpperCase() === subject && subject.length > 0) {
    warnings.push("Subject line is in ALL CAPS");
    score -= 15;
  }

  for (const word of SPAM_WORDS) {
    if (fullText.toUpperCase().includes(word)) {
      warnings.push(`Contains spam trigger word: "${word}"`);
      score -= 10;
    }
  }

  for (const { pattern, message } of SPAM_PATTERNS) {
    if (pattern.test(fullText)) {
      warnings.push(message);
      score -= 10;
    }
  }

  const httpLinks = (fullText.match(/http:\/\//g) || []).length;
  if (httpLinks > 0) {
    warnings.push(`Contains ${httpLinks} non-HTTPS link(s)`);
    score -= 10;
  }

  if (subject.length > 60) {
    suggestions.push(`Subject line is ${subject.length} characters (consider keeping under 60)`);
    score -= 5;
  }

  if (subject.length < 10 && subject.length > 0) {
    suggestions.push("Subject line is very short (under 10 characters)");
    score -= 5;
  }

  const urlMatches = fullText.match(/https?:\/\/[^\s]+/g) || [];
  if (urlMatches.length > 10) {
    warnings.push(`Contains ${urlMatches.length} links (high link count can trigger spam filters)`);
    score -= 15;
  }

  if (html) {
    if (html.includes("<script")) {
      warnings.push("Contains <script> tags (will be stripped by most email clients)");
      score -= 20;
    }

    if (html.includes("javascript:")) {
      warnings.push("Contains javascript: protocol (security risk)");
      score -= 20;
    }
  }

  const imageCount = (html.match(/<img/g) || []).length;
  if (imageCount > 0 && fullText.length < 100) {
    warnings.push("Image-heavy email with little text (can trigger spam filters)");
    score -= 10;
  }

  if (fullText.includes("unsubscribe") === false && fullText.length > 50) {
    suggestions.push("Consider adding an unsubscribe link (required for bulk email)");
  }

  if (warnings.length === 0 && suggestions.length === 0) {
    suggestions.push("Template looks good! No issues detected.");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    warnings,
    suggestions,
  };
}
