import { storage } from "../storage";
import type { InsertAuditLog } from "@shared/schema";

export const AuditEvents = {
  DOMAIN_ADDED: "DOMAIN_ADDED",
  DOMAIN_DELETED: "DOMAIN_DELETED",
  DNS_SCAN_RUN: "DNS_SCAN_RUN",
  DIFF_FOUND: "DIFF_FOUND",
  ALERT_SENT: "ALERT_SENT",
  PREFS_CHANGED: "PREFS_CHANGED",
  DESTINATION_ADDED: "DESTINATION_ADDED",
  DESTINATION_DELETED: "DESTINATION_DELETED",
  TEAM_CREATED: "TEAM_CREATED",
  TEAM_DELETED: "TEAM_DELETED",
  TEAM_MEMBER_ADDED: "TEAM_MEMBER_ADDED",
  TEAM_MEMBER_REMOVED: "TEAM_MEMBER_REMOVED",
  TEAM_MEMBER_ROLE_CHANGED: "TEAM_MEMBER_ROLE_CHANGED",
  PUBLIC_LINK_CREATED: "PUBLIC_LINK_CREATED",
  PUBLIC_LINK_REVOKED: "PUBLIC_LINK_REVOKED",
  PDF_EXPORTED: "PDF_EXPORTED",
  MONITORING_ENABLED: "MONITORING_ENABLED",
  MONITORING_DISABLED: "MONITORING_DISABLED",
} as const;

export type AuditEvent = typeof AuditEvents[keyof typeof AuditEvents];

interface AuditLogOptions {
  actorUserId: string;
  event: AuditEvent;
  domainId?: string;
  meta?: Record<string, any>;
}

export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  const { actorUserId, event, domainId, meta } = options;

  const auditLog: InsertAuditLog = {
    actorUserId,
    domainId: domainId ?? null,
    event,
    metaJson: meta ? meta : null,
  };

  await storage.createAuditLog(auditLog);
}
