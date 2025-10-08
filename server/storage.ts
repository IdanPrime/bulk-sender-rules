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

  getScanRunsByDomainId(domainId: string, limit?: number): Promise<ScanRun[]>;
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
  createAlert(alert: InsertAlert): Promise<Alert>;

  getAlertPref(userId: string): Promise<AlertPref | undefined>;
  upsertAlertPref(alertPref: InsertAlertPref): Promise<AlertPref>;

  createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByUserId(userId: string, type?: string): Promise<EmailLog[]>;
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

  async getScanRunsByDomainId(): Promise<ScanRun[]> {
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
}

import { DbStorage } from "./db-storage";

export const storage = process.env.NODE_ENV === "test" ? new MemStorage() : new DbStorage();
