import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  domains,
  reports,
  healthPoints,
  templateChecks,
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
}
