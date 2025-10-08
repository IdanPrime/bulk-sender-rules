import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  domains,
  reports,
  healthPoints,
  templateChecks,
  scanRuns,
  scanRecords,
  scanDiffs,
  alerts,
  alertPrefs,
  emailLog,
  type User,
  type InsertUser,
  type Domain,
  type InsertDomain,
  type Report,
  type InsertReport,
  type HealthPoint,
  type InsertHealthPoint,
  type TemplateCheck,
  type InsertTemplateCheck,
  type ScanRun,
  type InsertScanRun,
  type ScanRecord,
  type InsertScanRecord,
  type ScanDiff,
  type InsertScanDiff,
  type Alert,
  type InsertAlert,
  type AlertPref,
  type InsertAlertPref,
  type EmailLog,
  type InsertEmailLog,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const result = await db
      .update(users)
      .set({ stripeCustomerId, stripeSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserProStatus(userId: string, isPro: boolean): Promise<User> {
    const result = await db
      .update(users)
      .set({ isPro: isPro ? "true" : "false" })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async upgradeUserToPro(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const result = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        isPro: "true"
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getDomain(id: string): Promise<Domain | undefined> {
    const result = await db.select().from(domains).where(eq(domains.id, id));
    return result[0];
  }

  async getDomainsByUserId(userId: string): Promise<Domain[]> {
    return await db.select().from(domains).where(eq(domains.userId, userId));
  }

  async getDomainByName(userId: string, name: string): Promise<Domain | undefined> {
    const result = await db
      .select()
      .from(domains)
      .where(and(eq(domains.userId, userId), eq(domains.name, name)));
    return result[0];
  }

  async createDomain(domain: InsertDomain): Promise<Domain> {
    const result = await db.insert(domains).values(domain).returning();
    return result[0];
  }

  async deleteDomain(id: string): Promise<void> {
    await db.delete(domains).where(eq(domains.id, id));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async getReportBySlug(slug: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.slug, slug));
    return result[0];
  }

  async getReportsByDomainId(domainId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.domainId, domainId))
      .orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }

  async getHealthPointsByDomainId(domainId: string): Promise<HealthPoint[]> {
    return await db
      .select()
      .from(healthPoints)
      .where(eq(healthPoints.domainId, domainId))
      .orderBy(desc(healthPoints.createdAt));
  }

  async createHealthPoint(healthPoint: InsertHealthPoint): Promise<HealthPoint> {
    const result = await db.insert(healthPoints).values(healthPoint).returning();
    return result[0];
  }

  async getTemplateChecksByUserId(userId: string): Promise<TemplateCheck[]> {
    return await db
      .select()
      .from(templateChecks)
      .where(eq(templateChecks.userId, userId))
      .orderBy(desc(templateChecks.createdAt));
  }

  async createTemplateCheck(templateCheck: InsertTemplateCheck): Promise<TemplateCheck> {
    const result = await db.insert(templateChecks).values(templateCheck).returning();
    return result[0];
  }

  async getScanRunsByDomainId(domainId: string, limit?: number): Promise<ScanRun[]> {
    const query = db
      .select()
      .from(scanRuns)
      .where(eq(scanRuns.domainId, domainId))
      .orderBy(desc(scanRuns.createdAt));
    
    return limit ? await query.limit(limit) : await query;
  }

  async getLatestScanRunByDomainId(domainId: string): Promise<ScanRun | undefined> {
    const result = await db
      .select()
      .from(scanRuns)
      .where(eq(scanRuns.domainId, domainId))
      .orderBy(desc(scanRuns.createdAt))
      .limit(1);
    return result[0];
  }

  async getScanRunByDomainIdAndDate(domainId: string, date: string): Promise<ScanRun | undefined> {
    const result = await db
      .select()
      .from(scanRuns)
      .where(and(
        eq(scanRuns.domainId, domainId),
        sql`DATE(${scanRuns.startedAt}) = ${date}`
      ))
      .limit(1);
    return result[0];
  }

  async createScanRun(scanRun: InsertScanRun): Promise<ScanRun> {
    const result = await db.insert(scanRuns).values(scanRun).returning();
    return result[0];
  }

  async updateScanRun(id: string, data: Partial<InsertScanRun>): Promise<ScanRun> {
    const result = await db
      .update(scanRuns)
      .set(data)
      .where(eq(scanRuns.id, id))
      .returning();
    return result[0];
  }

  async getScanRecordsByRunId(runId: string): Promise<ScanRecord[]> {
    return await db
      .select()
      .from(scanRecords)
      .where(eq(scanRecords.runId, runId));
  }

  async createScanRecord(scanRecord: InsertScanRecord): Promise<ScanRecord> {
    const result = await db.insert(scanRecords).values(scanRecord).returning();
    return result[0];
  }

  async getLatestScanDiffByDomainId(domainId: string): Promise<ScanDiff | undefined> {
    const result = await db
      .select()
      .from(scanDiffs)
      .innerJoin(scanRuns, eq(scanDiffs.runId, scanRuns.id))
      .where(eq(scanRuns.domainId, domainId))
      .orderBy(desc(scanRuns.createdAt))
      .limit(1);
    return result[0]?.scan_diffs;
  }

  async createScanDiff(scanDiff: InsertScanDiff): Promise<ScanDiff> {
    const result = await db.insert(scanDiffs).values(scanDiff).returning();
    return result[0];
  }

  async getAlertsByDomainId(domainId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.domainId, domainId))
      .orderBy(desc(alerts.sentAt));
  }

  async getAlertsByUserId(userId: string): Promise<Alert[]> {
    const result = await db
      .select()
      .from(alerts)
      .innerJoin(domains, eq(alerts.domainId, domains.id))
      .where(eq(domains.userId, userId))
      .orderBy(desc(alerts.sentAt));
    return result.map(r => r.alerts);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
  }

  async getAlertPref(userId: string): Promise<AlertPref | undefined> {
    const result = await db
      .select()
      .from(alertPrefs)
      .where(eq(alertPrefs.userId, userId));
    return result[0];
  }

  async upsertAlertPref(alertPref: InsertAlertPref): Promise<AlertPref> {
    const result = await db
      .insert(alertPrefs)
      .values(alertPref)
      .onConflictDoUpdate({
        target: alertPrefs.userId,
        set: alertPref,
      })
      .returning();
    return result[0];
  }

  async createEmailLog(log: InsertEmailLog): Promise<EmailLog> {
    const result = await db.insert(emailLog).values(log).returning();
    return result[0];
  }

  async getEmailLogsByUserId(userId: string, emailType?: string): Promise<EmailLog[]> {
    if (emailType) {
      return await db
        .select()
        .from(emailLog)
        .where(and(eq(emailLog.userId, userId), eq(emailLog.type, emailType)))
        .orderBy(desc(emailLog.sentAt));
    }
    return await db
      .select()
      .from(emailLog)
      .where(eq(emailLog.userId, userId))
      .orderBy(desc(emailLog.sentAt));
  }

  async updateDomainMonitoring(domainId: string, enabled: boolean): Promise<Domain> {
    const result = await db
      .update(domains)
      .set({ monitoringEnabled: enabled ? "true" : "false" })
      .where(eq(domains.id, domainId))
      .returning();
    return result[0];
  }

  async getMonitoredDomains(): Promise<Domain[]> {
    const result = await db
      .select({
        id: domains.id,
        userId: domains.userId,
        name: domains.name,
        monitoringEnabled: domains.monitoringEnabled,
        createdAt: domains.createdAt,
      })
      .from(domains)
      .innerJoin(users, eq(domains.userId, users.id))
      .where(and(eq(domains.monitoringEnabled, "true"), eq(users.isPro, "true")));
    return result;
  }
}
