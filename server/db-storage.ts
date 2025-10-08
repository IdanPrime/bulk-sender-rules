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
  destinations,
  planLimits,
  teams,
  teamMembers,
  teamDomains,
  auditLog,
  publicReports,
  reportExports,
  domainAlertPrefs,
  appEvents,
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
  type Destination,
  type InsertDestination,
  type PlanLimit,
  type InsertPlanLimit,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type TeamDomain,
  type InsertTeamDomain,
  type AuditLog,
  type InsertAuditLog,
  type PublicReport,
  type InsertPublicReport,
  type ReportExport,
  type InsertReportExport,
  type DomainAlertPref,
  type InsertDomainAlertPref,
  type AppEvent,
  type InsertAppEvent,
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

  async getScanRun(id: string): Promise<ScanRun | undefined> {
    const result = await db.select().from(scanRuns).where(eq(scanRuns.id, id));
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

  async getScansSince(userId: string, since: Date): Promise<ScanRun[]> {
    const result = await db
      .select()
      .from(scanRuns)
      .innerJoin(domains, eq(scanRuns.domainId, domains.id))
      .where(and(
        eq(domains.userId, userId),
        sql`${scanRuns.createdAt} >= ${since.toISOString()}`
      ))
      .orderBy(desc(scanRuns.createdAt));
    return result.map(r => r.scan_runs);
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

  async getAlertsSince(userId: string, since: Date): Promise<Alert[]> {
    const result = await db
      .select()
      .from(alerts)
      .innerJoin(domains, eq(alerts.domainId, domains.id))
      .where(and(
        eq(domains.userId, userId),
        sql`${alerts.sentAt} >= ${since.toISOString()}`
      ))
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

  async getDestinationsByUserId(userId: string): Promise<Destination[]> {
    return await db.select().from(destinations).where(eq(destinations.userId, userId));
  }

  async createDestination(destination: InsertDestination): Promise<Destination> {
    const result = await db.insert(destinations).values(destination).returning();
    return result[0];
  }

  async deleteDestination(id: string): Promise<void> {
    await db.delete(destinations).where(eq(destinations.id, id));
  }

  async updateDestinationEnabled(id: string, enabled: boolean): Promise<Destination> {
    const result = await db
      .update(destinations)
      .set({ enabled: enabled ? "true" : "false" })
      .where(eq(destinations.id, id))
      .returning();
    return result[0];
  }

  async getPlanLimit(plan: string): Promise<PlanLimit | undefined> {
    const result = await db.select().from(planLimits).where(eq(planLimits.plan, plan));
    return result[0];
  }

  async getAllPlanLimits(): Promise<PlanLimit[]> {
    return await db.select().from(planLimits);
  }

  async getTeamsByUserId(userId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.ownerUserId, userId));
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  async getTeamMembersByTeamId(teamId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async getTeamMembersByUserId(userId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
  }

  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(teamMember).returning();
    return result[0];
  }

  async deleteTeamMember(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember> {
    const result = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return result[0];
  }

  async getTeamDomainsByTeamId(teamId: string): Promise<TeamDomain[]> {
    return await db.select().from(teamDomains).where(eq(teamDomains.teamId, teamId));
  }

  async getTeamDomainsByDomainId(domainId: string): Promise<TeamDomain[]> {
    return await db.select().from(teamDomains).where(eq(teamDomains.domainId, domainId));
  }

  async createTeamDomain(teamDomain: InsertTeamDomain): Promise<TeamDomain> {
    const result = await db.insert(teamDomains).values(teamDomain).returning();
    return result[0];
  }

  async deleteTeamDomain(teamId: string, domainId: string): Promise<void> {
    await db.delete(teamDomains).where(and(eq(teamDomains.teamId, teamId), eq(teamDomains.domainId, domainId)));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLog).values(log).returning();
    return result[0];
  }

  async getAuditLogsByDomainId(domainId: string, limit?: number): Promise<AuditLog[]> {
    let query = db
      .select()
      .from(auditLog)
      .where(eq(auditLog.domainId, domainId))
      .orderBy(desc(auditLog.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async getAuditLogsByUserId(userId: string, limit?: number): Promise<AuditLog[]> {
    let query = db
      .select()
      .from(auditLog)
      .where(eq(auditLog.actorUserId, userId))
      .orderBy(desc(auditLog.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async getPublicReportByToken(token: string): Promise<PublicReport | undefined> {
    const result = await db.select().from(publicReports).where(eq(publicReports.token, token));
    return result[0];
  }

  async getPublicReportsByDomainId(domainId: string): Promise<PublicReport[]> {
    return await db.select().from(publicReports).where(eq(publicReports.domainId, domainId));
  }

  async createPublicReport(publicReport: InsertPublicReport): Promise<PublicReport> {
    const result = await db.insert(publicReports).values(publicReport).returning();
    return result[0];
  }

  async deletePublicReport(id: string): Promise<void> {
    await db.delete(publicReports).where(eq(publicReports.id, id));
  }

  async getReportExportsByDomainId(domainId: string): Promise<ReportExport[]> {
    return await db.select().from(reportExports).where(eq(reportExports.domainId, domainId));
  }

  async createReportExport(reportExport: InsertReportExport): Promise<ReportExport> {
    const result = await db.insert(reportExports).values(reportExport).returning();
    return result[0];
  }

  async getDomainAlertPref(domainId: string): Promise<DomainAlertPref | undefined> {
    const result = await db.select().from(domainAlertPrefs).where(eq(domainAlertPrefs.domainId, domainId));
    return result[0];
  }

  async upsertDomainAlertPref(domainAlertPref: InsertDomainAlertPref): Promise<DomainAlertPref> {
    const result = await db
      .insert(domainAlertPrefs)
      .values(domainAlertPref)
      .onConflictDoUpdate({
        target: domainAlertPrefs.domainId,
        set: domainAlertPref,
      })
      .returning();
    return result[0];
  }

  async updateUserPlan(userId: string, plan: string): Promise<User> {
    const result = await db
      .update(users)
      .set({ plan })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async createAppEvent(appEvent: InsertAppEvent): Promise<AppEvent> {
    const result = await db.insert(appEvents).values(appEvent).returning();
    return result[0];
  }

  async getAppEventsByUserId(userId: string, limit: number = 100): Promise<AppEvent[]> {
    return await db
      .select()
      .from(appEvents)
      .where(eq(appEvents.userId, userId))
      .orderBy(desc(appEvents.createdAt))
      .limit(limit);
  }

  async getAppEventsByEvent(event: string, limit: number = 100): Promise<AppEvent[]> {
    return await db
      .select()
      .from(appEvents)
      .where(eq(appEvents.event, event))
      .orderBy(desc(appEvents.createdAt))
      .limit(limit);
  }
}
