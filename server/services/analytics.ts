import { IStorage } from "../storage";

export enum AppEventType {
  USER_REGISTERED = "user_registered",
  USER_LOGIN = "user_login",
  DOMAIN_ADDED = "domain_added",
  DOMAIN_DELETED = "domain_deleted",
  SCAN_INITIATED = "scan_initiated",
  SCAN_COMPLETED = "scan_completed",
  ALERT_SENT = "alert_sent",
  PDF_EXPORTED = "pdf_exported",
  SUBSCRIPTION_UPGRADED = "subscription_upgraded",
  SUBSCRIPTION_DOWNGRADED = "subscription_downgraded",
  WEEKLY_DIGEST_SENT = "weekly_digest_sent",
  PUBLIC_REPORT_CREATED = "public_report_created",
}

export async function trackEvent(
  storage: IStorage,
  event: AppEventType,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await storage.createAppEvent({
      userId: userId || null,
      event,
      metaJson: metadata || {},
    });
  } catch (error) {
    // Silent failure - analytics shouldn't break app functionality
    console.error(`[analytics] Failed to track event ${event}:`, error);
  }
}
