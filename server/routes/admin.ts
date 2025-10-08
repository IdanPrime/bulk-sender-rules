import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth-routes";
import { db } from "../db";
import { users, domains, scanRuns, alerts, emailLog } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";

const router = Router();

// Middleware to check if user is admin (for now, just check if they're authenticated)
// In a real app, you'd have an isAdmin field on the user
function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // For now, all authenticated users can see metrics
  // In production, you'd check: if (!req.user.isAdmin) { return res.status(403)... }
  
  next();
}

// Get admin metrics
router.get("/metrics", requireAuth, requireAdmin, async (req, res) => {
  try {
    // Calculate date ranges
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Active users by plan
    const allUsers = await db.select().from(users);
    const usersByPlan = allUsers.reduce((acc, user) => {
      const plan = user.plan || "Free";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Total domains monitored
    const allDomains = await db.select().from(domains);
    const totalDomains = allDomains.length;
    const monitoredDomains = allDomains.filter(d => d.monitoringEnabled === "true").length;

    // Scans in last 24h and 7d
    const scansLast24h = await db
      .select({ count: sql<number>`count(*)` })
      .from(scanRuns)
      .where(gte(scanRuns.startedAt, last24h));

    const scansLast7d = await db
      .select({ count: sql<number>`count(*)` })
      .from(scanRuns)
      .where(gte(scanRuns.startedAt, last7d));

    // Alerts in last 24h
    const alertsLast24h = await db
      .select({ count: sql<number>`count(*)` })
      .from(alerts)
      .where(gte(alerts.sentAt, last24h));

    // Email failures (you'd track this with a status field in email_log in a real app)
    const emailFailures = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLog)
      .where(
        and(
          gte(emailLog.sentAt, last24h),
          eq(emailLog.type, "error")
        )
      );

    res.json({
      users: {
        byPlan: usersByPlan,
        total: allUsers.length,
      },
      domains: {
        total: totalDomains,
        monitored: monitoredDomains,
      },
      scans: {
        last24h: Number(scansLast24h[0]?.count || 0),
        last7d: Number(scansLast7d[0]?.count || 0),
      },
      alerts: {
        last24h: Number(alertsLast24h[0]?.count || 0),
      },
      email: {
        failuresLast24h: Number(emailFailures[0]?.count || 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
