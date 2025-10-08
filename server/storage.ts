import {
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
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserProStatus(userId: string, isPro: boolean): Promise<User>;
  upgradeUserToPro(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;

  getDomain(id: string): Promise<Domain | undefined>;
  getDomainsByUserId(userId: string): Promise<Domain[]>;
  getDomainByName(userId: string, name: string): Promise<Domain | undefined>;
  createDomain(domain: InsertDomain): Promise<Domain>;
  deleteDomain(id: string): Promise<void>;
  updateDomainMonitoring(domainId: string, enabled: boolean): Promise<Domain>;
  getMonitoredDomains(): Promise<Domain[]>;

  getReport(id: string): Promise<Report | undefined>;
  getReportBySlug(slug: string): Promise<Report | undefined>;
  getReportsByDomainId(domainId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  getHealthPointsByDomainId(domainId: string): Promise<HealthPoint[]>;
  createHealthPoint(healthPoint: InsertHealthPoint): Promise<HealthPoint>;

  getTemplateChecksByUserId(userId: string): Promise<TemplateCheck[]>;
  createTemplateCheck(templateCheck: InsertTemplateCheck): Promise<TemplateCheck>;

  getScanRun(id: string): Promise<ScanRun | undefined>;
  getScanRunsByDomainId(domainId: string, limit?: number): Promise<ScanRun[]>;
  getScansSince(userId: string, since: Date): Promise<ScanRun[]>;
  getLatestScanRunByDomainId(domainId: string): Promise<ScanRun | undefined>;
  getScanRunByDomainIdAndDate(domainId: string, date: string): Promise<ScanRun | undefined>;
  createScanRun(scanRun: InsertScanRun): Promise<ScanRun>;
  updateScanRun(id: string, data: Partial<InsertScanRun>): Promise<ScanRun>;

  getScanRecordsByRunId(runId: string): Promise<ScanRecord[]>;
  createScanRecord(scanRecord: InsertScanRecord): Promise<ScanRecord>;

  getLatestScanDiffByDomainId(domainId: string): Promise<ScanDiff | undefined>;
  createScanDiff(scanDiff: InsertScanDiff): Promise<ScanDiff>;

  getAlertsByDomainId(domainId: string): Promise<Alert[]>;
  getAlertsByUserId(userId: string): Promise<Alert[]>;
  getAlertsSince(userId: string, since: Date): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;

  getAlertPref(userId: string): Promise<AlertPref | undefined>;
  upsertAlertPref(alertPref: InsertAlertPref): Promise<AlertPref>;

  createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByUserId(userId: string, type?: string): Promise<EmailLog[]>;

  getDestinationsByUserId(userId: string): Promise<Destination[]>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  deleteDestination(id: string): Promise<void>;
  updateDestinationEnabled(id: string, enabled: boolean): Promise<Destination>;

  getPlanLimit(plan: string): Promise<PlanLimit | undefined>;
  getAllPlanLimits(): Promise<PlanLimit[]>;

  getTeamsByUserId(userId: string): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  deleteTeam(id: string): Promise<void>;

  getTeamMembersByTeamId(teamId: string): Promise<TeamMember[]>;
  getTeamMembersByUserId(userId: string): Promise<TeamMember[]>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  deleteTeamMember(teamId: string, userId: string): Promise<void>;
  updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember>;

  getTeamDomainsByTeamId(teamId: string): Promise<TeamDomain[]>;
  getTeamDomainsByDomainId(domainId: string): Promise<TeamDomain[]>;
  createTeamDomain(teamDomain: InsertTeamDomain): Promise<TeamDomain>;
  deleteTeamDomain(teamId: string, domainId: string): Promise<void>;

  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByDomainId(domainId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUserId(userId: string, limit?: number): Promise<AuditLog[]>;

  getPublicReportByToken(token: string): Promise<PublicReport | undefined>;
  getPublicReportsByDomainId(domainId: string): Promise<PublicReport[]>;
  createPublicReport(publicReport: InsertPublicReport): Promise<PublicReport>;
  deletePublicReport(id: string): Promise<void>;

  getReportExportsByDomainId(domainId: string): Promise<ReportExport[]>;
  createReportExport(reportExport: InsertReportExport): Promise<ReportExport>;

  getDomainAlertPref(domainId: string): Promise<DomainAlertPref | undefined>;
  upsertDomainAlertPref(domainAlertPref: InsertDomainAlertPref): Promise<DomainAlertPref>;
  updateUserPlan(userId: string, plan: string): Promise<User>;

  createAppEvent(appEvent: InsertAppEvent): Promise<AppEvent>;
  getAppEventsByUserId(userId: string, limit?: number): Promise<AppEvent[]>;
  getAppEventsByEvent(event: string, limit?: number): Promise<AppEvent[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private domains: Map<string, Domain>;
  private reports: Map<string, Report>;
  private healthPoints: Map<string, HealthPoint>;
  private templateChecks: Map<string, TemplateCheck>;
  private scanRuns: Map<string, ScanRun>;
  private scanRecords: Map<string, ScanRecord>;
  private scanDiffs: Map<string, ScanDiff>;
  private alerts: Map<string, Alert>;
  private alertPrefs: Map<string, AlertPref>;
  private emailLogs: Map<string, EmailLog>;

  constructor() {
    this.users = new Map();
    this.domains = new Map();
    this.reports = new Map();
    this.healthPoints = new Map();
    this.templateChecks = new Map();
    this.scanRuns = new Map();
    this.scanRecords = new Map();
    this.scanDiffs = new Map();
    this.alerts = new Map();
    this.alertPrefs = new Map();
    this.emailLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.stripeCustomerId === stripeCustomerId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      passwordHash: insertUser.passwordHash ?? null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      isPro: "false",
      plan: "Free",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.stripeCustomerId = stripeCustomerId;
    user.stripeSubscriptionId = stripeSubscriptionId;
    this.users.set(userId, user);
    return user;
  }

  async updateUserProStatus(userId: string, isPro: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.isPro = isPro ? "true" : "false";
    this.users.set(userId, user);
    return user;
  }

  async upgradeUserToPro(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.stripeCustomerId = stripeCustomerId;
    user.stripeSubscriptionId = stripeSubscriptionId;
    user.isPro = "true";
    this.users.set(userId, user);
    return user;
  }

  async getDomain(id: string): Promise<Domain | undefined> {
    return this.domains.get(id);
  }

  async getDomainsByUserId(userId: string): Promise<Domain[]> {
    return Array.from(this.domains.values()).filter((domain) => domain.userId === userId);
  }

  async getDomainByName(userId: string, name: string): Promise<Domain | undefined> {
    return Array.from(this.domains.values()).find(
      (domain) => domain.userId === userId && domain.name === name
    );
  }

  async createDomain(insertDomain: InsertDomain): Promise<Domain> {
    const id = randomUUID();
    const domain: Domain = {
      id,
      name: insertDomain.name,
      userId: insertDomain.userId ?? null,
      monitoringEnabled: insertDomain.monitoringEnabled ?? "false",
      createdAt: new Date(),
    };
    this.domains.set(id, domain);
    return domain;
  }

  async deleteDomain(id: string): Promise<void> {
    this.domains.delete(id);
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportBySlug(slug: string): Promise<Report | undefined> {
    return Array.from(this.reports.values()).find((report) => report.slug === slug);
  }

  async getReportsByDomainId(domainId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter((report) => report.domainId === domainId);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      id,
      slug: insertReport.slug,
      domainId: insertReport.domainId ?? null,
      scanJson: insertReport.scanJson,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getHealthPointsByDomainId(domainId: string): Promise<HealthPoint[]> {
    return Array.from(this.healthPoints.values())
      .filter((hp) => hp.domainId === domainId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createHealthPoint(insertHealthPoint: InsertHealthPoint): Promise<HealthPoint> {
    const id = randomUUID();
    const healthPoint: HealthPoint = {
      id,
      domainId: insertHealthPoint.domainId,
      sent: insertHealthPoint.sent,
      openRate: insertHealthPoint.openRate,
      spamRate: insertHealthPoint.spamRate,
      hardBounces: insertHealthPoint.hardBounces,
      softBounces: insertHealthPoint.softBounces,
      note: insertHealthPoint.note ?? null,
      createdAt: new Date(),
    };
    this.healthPoints.set(id, healthPoint);
    return healthPoint;
  }

  async getTemplateChecksByUserId(userId: string): Promise<TemplateCheck[]> {
    return Array.from(this.templateChecks.values())
      .filter((tc) => tc.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTemplateCheck(insertTemplateCheck: InsertTemplateCheck): Promise<TemplateCheck> {
    const id = randomUUID();
    const templateCheck: TemplateCheck = {
      id,
      userId: insertTemplateCheck.userId ?? null,
      subject: insertTemplateCheck.subject,
      html: insertTemplateCheck.html ?? null,
      text: insertTemplateCheck.text ?? null,
      resultJson: insertTemplateCheck.resultJson,
      createdAt: new Date(),
    };
    this.templateChecks.set(id, templateCheck);
    return templateCheck;
  }

  async getScanRun(): Promise<ScanRun | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getScanRunsByDomainId(): Promise<ScanRun[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getScansSince(): Promise<ScanRun[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getLatestScanRunByDomainId(): Promise<ScanRun | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getScanRunByDomainIdAndDate(): Promise<ScanRun | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createScanRun(): Promise<ScanRun> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async updateScanRun(): Promise<ScanRun> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getScanRecordsByRunId(): Promise<ScanRecord[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createScanRecord(): Promise<ScanRecord> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getLatestScanDiffByDomainId(): Promise<ScanDiff | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createScanDiff(): Promise<ScanDiff> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAlertsByDomainId(): Promise<Alert[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAlertsByUserId(): Promise<Alert[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAlertsSince(): Promise<Alert[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createAlert(): Promise<Alert> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAlertPref(): Promise<AlertPref | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async upsertAlertPref(): Promise<AlertPref> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createEmailLog(): Promise<EmailLog> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getEmailLogsByUserId(): Promise<EmailLog[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async updateDomainMonitoring(domainId: string, enabled: boolean): Promise<Domain> {
    const domain = this.domains.get(domainId);
    if (!domain) throw new Error("Domain not found");
    domain.monitoringEnabled = enabled ? "true" : "false";
    this.domains.set(domainId, domain);
    return domain;
  }

  async getMonitoredDomains(): Promise<Domain[]> {
    return Array.from(this.domains.values()).filter((domain) => {
      if (domain.monitoringEnabled !== "true" || !domain.userId) return false;
      const user = this.users.get(domain.userId);
      return user?.isPro === "true";
    });
  }

  async getDestinationsByUserId(): Promise<Destination[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createDestination(): Promise<Destination> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async deleteDestination(): Promise<void> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async updateDestinationEnabled(): Promise<Destination> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getPlanLimit(): Promise<PlanLimit | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAllPlanLimits(): Promise<PlanLimit[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getTeamsByUserId(): Promise<Team[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getTeamById(): Promise<Team | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createTeam(): Promise<Team> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async deleteTeam(): Promise<void> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getTeamMembersByTeamId(): Promise<TeamMember[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getTeamMembersByUserId(): Promise<TeamMember[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createTeamMember(): Promise<TeamMember> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async deleteTeamMember(): Promise<void> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async updateTeamMemberRole(): Promise<TeamMember> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getTeamDomainsByTeamId(): Promise<TeamDomain[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getTeamDomainsByDomainId(): Promise<TeamDomain[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createTeamDomain(): Promise<TeamDomain> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async deleteTeamDomain(): Promise<void> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createAuditLog(): Promise<AuditLog> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAuditLogsByDomainId(): Promise<AuditLog[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAuditLogsByUserId(): Promise<AuditLog[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getPublicReportByToken(): Promise<PublicReport | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getPublicReportsByDomainId(): Promise<PublicReport[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createPublicReport(): Promise<PublicReport> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async deletePublicReport(): Promise<void> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getReportExportsByDomainId(): Promise<ReportExport[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async createReportExport(): Promise<ReportExport> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getDomainAlertPref(): Promise<DomainAlertPref | undefined> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async upsertDomainAlertPref(): Promise<DomainAlertPref> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async updateUserPlan(userId: string, plan: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.plan = plan;
    this.users.set(userId, user);
    return user;
  }

  async createAppEvent(): Promise<AppEvent> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAppEventsByUserId(): Promise<AppEvent[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }

  async getAppEventsByEvent(): Promise<AppEvent[]> {
    throw new Error("MemStorage: Not implemented - use DbStorage");
  }
}

import { DbStorage } from "./db-storage";

export const storage = process.env.NODE_ENV === "test" ? new MemStorage() : new DbStorage();
