import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isPro: text("is_pro").default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const domains = pgTable("domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  domainId: varchar("domain_id").references(() => domains.id),
  scanJson: jsonb("scan_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthPoints = pgTable("health_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").references(() => domains.id).notNull(),
  sent: integer("sent").notNull(),
  openRate: real("open_rate").notNull(),
  spamRate: real("spam_rate").notNull(),
  hardBounces: integer("hard_bounces").notNull(),
  softBounces: integer("soft_bounces").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateChecks = pgTable("template_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  html: text("html"),
  text: text("text"),
  resultJson: jsonb("result_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertHealthPointSchema = createInsertSchema(healthPoints).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateCheckSchema = createInsertSchema(templateChecks).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertHealthPoint = z.infer<typeof insertHealthPointSchema>;
export type HealthPoint = typeof healthPoints.$inferSelect;

export type InsertTemplateCheck = z.infer<typeof insertTemplateCheckSchema>;
export type TemplateCheck = typeof templateChecks.$inferSelect;
