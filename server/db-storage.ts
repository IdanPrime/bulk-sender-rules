import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  domains,
  reports,
  healthPoints,
  templateChecks,
  scans,
  alerts,
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
  type Scan,
  type InsertScan,
  type Alert,
  type InsertAlert,
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

  async getScansByDomainId(domainId: string): Promise<Scan[]> {
    return await db
      .select()
      .from(scans)
      .where(eq(scans.domainId, domainId))
      .orderBy(desc(scans.createdAt));
  }

  async getLatestScanByDomainId(domainId: string): Promise<Scan | undefined> {
    const result = await db
      .select()
      .from(scans)
      .where(eq(scans.domainId, domainId))
      .orderBy(desc(scans.createdAt))
      .limit(1);
    return result[0];
  }

  async createScan(scan: InsertScan): Promise<Scan> {
    const result = await db.insert(scans).values(scan).returning();
    return result[0];
  }

  async getAlertsByDomainId(domainId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.domainId, domainId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlertsByUserId(userId: string): Promise<Alert[]> {
    const result = await db
      .select({
        id: alerts.id,
        domainId: alerts.domainId,
        recordType: alerts.recordType,
        oldValue: alerts.oldValue,
        newValue: alerts.newValue,
        createdAt: alerts.createdAt,
      })
      .from(alerts)
      .innerJoin(domains, eq(alerts.domainId, domains.id))
      .where(eq(domains.userId, userId))
      .orderBy(desc(alerts.createdAt));
    return result;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
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
