import nodemailer from "nodemailer";

interface AlertEmail {
  to: string;
  domain: string;
  recordType: string;
  oldValue: string;
  newValue: string;
}

async function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("[notify] SMTP not configured, logging to console instead");
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendAlertEmail(alert: AlertEmail): Promise<void> {
  const transporter = await createTransporter();

  const subject = `DNS Record Changed: ${alert.domain}`;
  const text = `
DNS Record Change Detected

Domain: ${alert.domain}
Record Type: ${alert.recordType}
Old Value: ${alert.oldValue}
New Value: ${alert.newValue}

This is an automated alert from your Deliverability Copilot monitoring system.
  `.trim();

  if (!transporter) {
    console.log("[notify] Would send email:");
    console.log(`  To: ${alert.to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: alert.to,
      subject,
      text,
    });
    console.log(`[notify] ✓ Alert email sent: ${info.messageId}`);
  } catch (error) {
    console.error("[notify] ✗ Failed to send email:", error);
    throw error;
  }
}
