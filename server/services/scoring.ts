import type { DNSScanResult } from "../lib/dns-scanner";

export interface ScoreBreakdown {
  spf: { pass: number; alignment: number };
  dkim: { pass: number; keyStrength: number };
  dmarc: { policy: number };
  bimi: { present: number; valid: number };
  mx: { sane: number };
  warnings: { count: number; penalty: number };
  fails: { count: number; penalty: number };
  total: number;
}

export function calculateDeliverabilityScore(scan: DNSScanResult): { score: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    spf: { pass: 0, alignment: 0 },
    dkim: { pass: 0, keyStrength: 0 },
    dmarc: { policy: 0 },
    bimi: { present: 0, valid: 0 },
    mx: { sane: 0 },
    warnings: { count: 0, penalty: 0 },
    fails: { count: 0, penalty: 0 },
    total: 0,
  };

  if (scan.spf.status === "PASS") {
    breakdown.spf.pass = 10;
    if (scan.spf.record && scan.spf.record.includes("-all")) {
      breakdown.spf.alignment = 10;
    } else if (scan.spf.record && scan.spf.record.includes("~all")) {
      breakdown.spf.alignment = 5;
    }
  }

  if (scan.dkim.status === "PASS") {
    breakdown.dkim.pass = 20;
    for (const selector of scan.dkim.selectors) {
      if (selector.status === "PASS" && selector.record) {
        if (selector.record.includes("k=rsa") && selector.record.length > 400) {
          breakdown.dkim.keyStrength = 10;
          break;
        }
      }
    }
  }

  if (scan.dmarc.record) {
    if (scan.dmarc.record.includes("p=reject")) {
      breakdown.dmarc.policy = 20;
    } else if (scan.dmarc.record.includes("p=quarantine")) {
      breakdown.dmarc.policy = 10;
    }
  }

  if (scan.bimi.record) {
    breakdown.bimi.present = 5;
    if (scan.bimi.status === "PASS") {
      breakdown.bimi.valid = 5;
    }
  }

  if (scan.mx.status !== "FAIL") {
    breakdown.mx.sane = 10;
  }

  let warningCount = 0;
  let failCount = 0;

  if (scan.spf.status === "WARN") warningCount += scan.spf.issues.length;
  if (scan.spf.status === "FAIL") failCount += scan.spf.issues.length;
  
  if (scan.dkim.status === "WARN") warningCount += 1;
  if (scan.dkim.status === "FAIL") failCount += 1;
  
  if (scan.dmarc.status === "WARN") warningCount += scan.dmarc.issues.length;
  if (scan.dmarc.status === "FAIL") failCount += scan.dmarc.issues.length;
  
  if (scan.bimi.status === "WARN") warningCount += 1;
  if (scan.bimi.status === "FAIL") failCount += 1;
  
  if (scan.mx.status === "WARN") warningCount += 1;
  if (scan.mx.status === "FAIL") failCount += 1;

  breakdown.warnings.count = warningCount;
  breakdown.warnings.penalty = Math.min(warningCount * 5, 0);
  
  breakdown.fails.count = failCount;
  breakdown.fails.penalty = Math.min(failCount * 10, 0);

  const rawScore =
    breakdown.spf.pass +
    breakdown.spf.alignment +
    breakdown.dkim.pass +
    breakdown.dkim.keyStrength +
    breakdown.dmarc.policy +
    breakdown.bimi.present +
    breakdown.bimi.valid +
    breakdown.mx.sane -
    breakdown.warnings.penalty -
    breakdown.fails.penalty;

  breakdown.total = Math.max(0, Math.min(100, rawScore));

  return { score: breakdown.total, breakdown };
}

export function getScoreBadge(score: number): { label: string; variant: string } {
  if (score >= 85) return { label: "Excellent", variant: "success" };
  if (score >= 70) return { label: "Good", variant: "default" };
  if (score >= 50) return { label: "Needs Work", variant: "warning" };
  return { label: "Poor", variant: "destructive" };
}
