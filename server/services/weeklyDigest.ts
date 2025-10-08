import { IStorage } from "../storage";
import nodemailer from "nodemailer";

export interface DigestData {
  userName: string;
  userEmail: string;
  domains: {
    name: string;
    score: number;
    lastScanned: string;
    alertCount: number;
    status: "pass" | "warn" | "fail";
  }[];
  weeklyStats: {
    totalScans: number;
    totalAlerts: number;
    avgScore: number;
  };
}

export function generateDigestHTML(data: DigestData): string {
  const statusColors = {
    pass: "#10b981",
    warn: "#f59e0b",
    fail: "#ef4444",
  };

  const domainRows = data.domains.map(d => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">
        <strong style="color: #111827;">${d.name}</strong>
      </td>
      <td style="padding: 12px 8px; text-align: center;">
        <span style="
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          background: ${statusColors[d.status]}15;
          color: ${statusColors[d.status]};
        ">${d.score}/100</span>
      </td>
      <td style="padding: 12px 8px; text-align: center; color: #6b7280;">
        ${d.alertCount}
      </td>
      <td style="padding: 12px 8px; color: #9ca3af; font-size: 14px;">
        ${d.lastScanned}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Deliverability Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                📊 Weekly Deliverability Digest
              </h1>
              <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">
                Your email health summary
              </p>
            </td>
          </tr>

          <!-- Stats Cards -->
          <tr>
            <td style="padding: 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding: 16px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      ${data.weeklyStats.totalScans}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Scans
                    </div>
                  </td>
                  <td width="2%"></td>
                  <td width="33%" style="padding: 16px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      ${data.weeklyStats.totalAlerts}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Alerts
                    </div>
                  </td>
                  <td width="2%"></td>
                  <td width="30%" style="padding: 16px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                      ${data.weeklyStats.avgScore}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Avg Score
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Domain Table -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">
                Your Domains
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Domain
                    </th>
                    <th style="padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Score
                    </th>
                    <th style="padding: 12px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Alerts
                    </th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Last Scan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${domainRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 24px 32px 24px; text-align: center;">
              <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard` : 'https://your-domain.com/dashboard'}" 
                 style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View Full Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                You're receiving this because you have email deliverability monitoring enabled.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
                <a href="${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}/settings/alerts` : '#'}" style="color: #3b82f6; text-decoration: none;">
                  Manage preferences
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendWeeklyDigest(
  storage: IStorage,
  userId: string,
  digestData: DigestData
): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = generateDigestHTML(digestData);

  await transporter.sendMail({
    from: `"Deliverability Copilot" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `📊 Your Weekly Deliverability Digest`,
    html,
  });

  // Log to email_log table
  await storage.createEmailLog({
    userId,
    type: "weekly_digest",
    metaJson: {
      domainCount: digestData.domains.length,
      totalScans: digestData.weeklyStats.totalScans,
      totalAlerts: digestData.weeklyStats.totalAlerts,
      avgScore: digestData.weeklyStats.avgScore,
    },
  });
}
