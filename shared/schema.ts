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
  monitoringEnabled: text("monitoring_enabled").default("false").notNull(),
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

export const scanRuns = pgTable("scan_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").references(() => domains.id, { onDelete: "cascade" }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull(),
  errorText: text("error_text"),
  score: integer("score"),
  scoreBreakdown: jsonb("score_breakdown"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scanRecords = pgTable("scan_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").references(() => scanRuns.id, { onDelete: "cascade" }).notNull(),
  recordType: text("record_type").notNull(),
  selector: text("selector"),
  valueHash: text("value_hash").notNull(),
  rawValue: text("raw_value").notNull(),
  verdict: text("verdict").notNull(),
  metaJson: jsonb("meta_json"),
});

export const scanDiffs = pgTable("scan_diffs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").references(() => scanRuns.id, { onDelete: "cascade" }).notNull(),
  addedJson: jsonb("added_json"),
  removedJson: jsonb("removed_json"),
  changedJson: jsonb("changed_json"),
  severity: text("severity").notNull(),
});

export const alertPrefs = pgTable("alert_prefs", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: text("email_enabled").default("true").notNull(),
  slackEnabled: text("slack_enabled").default("false").notNull(),
  threshold: text("threshold").default("warn").notNull(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").references(() => domains.id, { onDelete: "cascade" }).notNull(),
  runId: varchar("run_id").references(() => scanRuns.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const emailLog = pgTable("email_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  metaJson: jsonb("meta_json"),
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

export const insertScanRunSchema = createInsertSchema(scanRuns).omit({
  id: true,
  createdAt: true,
});

export const insertScanRecordSchema = createInsertSchema(scanRecords).omit({
  id: true,
});

export const insertScanDiffSchema = createInsertSchema(scanDiffs).omit({
  id: true,
});

export const insertAlertPrefSchema = createInsertSchema(alertPrefs);

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLog).omit({
  id: true,
  sentAt: true,
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

export type InsertScanRun = z.infer<typeof insertScanRunSchema>;
export type ScanRun = typeof scanRuns.$inferSelect;

export type InsertScanRecord = z.infer<typeof insertScanRecordSchema>;
export type ScanRecord = typeof scanRecords.$inferSelect;

export type InsertScanDiff = z.infer<typeof insertScanDiffSchema>;
export type ScanDiff = typeof scanDiffs.$inferSelect;

export type InsertAlertPref = z.infer<typeof insertAlertPrefSchema>;
export type AlertPref = typeof alertPrefs.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLog.$inferSelect;
