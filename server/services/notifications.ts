import { storage } from "../storage";
import type { Alert } from "@shared/schema";

interface SlackPayload {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
  }>;
}

interface WebhookPayload {
  domain: string;
  severity: string;
  title: string;
  body?: string;
  link?: string;
  timestamp: string;
}

export async function sendAlertNotifications(
  alert: Alert, 
  domainName: string,
  channelPrefs?: { emailEnabled: boolean; slackEnabled: boolean }
): Promise<boolean> {
  // Get domain owner
  const domain = await storage.getDomain(alert.domainId);
  if (!domain || !domain.userId) return false;

  // Get user destinations
  const destinations = await storage.getDestinationsByUserId(domain.userId);
  const enabledDestinations = destinations.filter(d => d.enabled === "true");

  // Filter by channel preferences if provided
  const filteredDestinations = channelPrefs 
    ? enabledDestinations.filter(d => {
        if (d.type === "slack" && !channelPrefs.slackEnabled) return false;
        if (d.type === "webhook" && !channelPrefs.slackEnabled) return false;
        return true;
      })
    : enabledDestinations;

  // Return false if no destinations to send to
  if (filteredDestinations.length === 0) {
    return false;
  }

  // Track if at least one notification succeeded
  let sentCount = 0;

  // Send to each destination
  for (const destination of filteredDestinations) {
    try {
      if (destination.type === "slack") {
        await sendSlackNotification(destination.url, alert, domainName);
        sentCount++;
      } else if (destination.type === "webhook") {
        await sendWebhookNotification(destination.url, alert, domainName);
        sentCount++;
      }
    } catch (error) {
      console.error(`Failed to send notification to ${destination.type}:`, error);
      // Continue sending to other destinations even if one fails
    }
  }

  return sentCount > 0;
}

async function sendSlackNotification(webhookUrl: string, alert: Alert, domainName: string): Promise<void> {
  const severityEmoji = {
    info: ":information_source:",
    warn: ":warning:",
    fail: ":x:",
  }[alert.severity.toLowerCase()] || ":bell:";

  const payload: SlackPayload = {
    text: `${severityEmoji} DNS Alert for ${domainName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${severityEmoji} ${alert.title}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Domain:* ${domainName}\n*Severity:* ${alert.severity}\n${alert.body || ""}`,
        },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}

async function sendWebhookNotification(webhookUrl: string, alert: Alert, domainName: string): Promise<void> {
  const payload: WebhookPayload = {
    domain: domainName,
    severity: alert.severity,
    title: alert.title,
    body: alert.body || undefined,
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000), // 5 second timeout
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Validate webhook URL for security
 * Prevents SSRF and other attacks
 */
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Must be HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    // Block private/internal IPs
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
