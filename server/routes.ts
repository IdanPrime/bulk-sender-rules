import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanDNS } from "./lib/dns-scanner";
import { lintTemplate } from "./lib/template-linter";
import { insertDomainSchema, insertReportSchema, insertHealthPointSchema, insertTemplateCheckSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { registerAuthRoutes, requireAuth } from "./auth-routes";
import { registerStripeRoutes } from "./stripe-routes";
import { registerAlertRoutes } from "./routes/alerts";
import { runDailyRescans } from "./lib/cron";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);
  registerStripeRoutes(app);
  registerAlertRoutes(app);

  app.post("/api/cron/rescan", async (req, res) => {
    try {
      const authKey = req.headers["x-cron-secret"] || req.query.key;
      const expectedKey = process.env.CRON_SECRET || "change-me-in-production";

      if (authKey !== expectedKey) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const result = await runDailyRescans();
      res.json(result);
    } catch (error: any) {
      console.error("Cron rescan error:", error);
      res.status(500).json({ error: "Re-scan failed", details: error.message });
    }
  });
  app.post("/api/scan", async (req, res) => {
    try {
      const { domain, save } = req.body;

      if (!domain || typeof domain !== "string") {
        return res.status(400).json({ error: "Domain is required" });
      }

      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      
      const scanResult = await scanDNS(cleanDomain);

      if (save && req.isAuthenticated() && req.user) {
        const user = req.user as any;
        
        let userDomain = await storage.getDomainByName(user.id, cleanDomain);
        if (!userDomain) {
          userDomain = await storage.createDomain({
            name: cleanDomain,
            userId: user.id,
          });
        }

        const slug = randomBytes(10).toString("hex");
        const report = await storage.createReport({
          slug,
          domainId: userDomain.id,
          scanJson: scanResult,
        });

        return res.json({ ...scanResult, reportSlug: report.slug, saved: true });
      }
      
      res.json(scanResult);
    } catch (error: any) {
      console.error("DNS scan error:", error);
      res.status(500).json({ error: "Failed to scan domain", details: error.message });
    }
  });

  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const domains = await storage.getDomainsByUserId(user.id);
      
      const domainsWithReports = await Promise.all(
        domains.map(async (domain) => {
          const reports = await storage.getReportsByDomainId(domain.id);
          return {
            ...domain,
            latestReport: reports[0] || null,
          };
        })
      );

      res.json({ domains: domainsWithReports });
    } catch (error: any) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  app.post("/api/domain", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { name } = req.body;
      const parsedDomain = insertDomainSchema.parse({ name, userId: user.id });
      
      const existingDomain = await storage.getDomainByName(user.id, name);

      if (existingDomain) {
        return res.status(400).json({ error: "Domain already exists" });
      }

      const domain = await storage.createDomain(parsedDomain);
      res.json(domain);
    } catch (error: any) {
      console.error("Create domain error:", error);
      res.status(400).json({ error: "Failed to create domain", details: error.message });
    }
  });

  app.get("/api/domain/:id", async (req, res) => {
    try {
      const domain = await storage.getDomain(req.params.id);
      
      if (!domain) {
        return res.status(404).json({ error: "Domain not found" });
      }

      const reports = await storage.getReportsByDomainId(domain.id);
      const healthPoints = await storage.getHealthPointsByDomainId(domain.id);

      res.json({ domain, reports, healthPoints });
    } catch (error: any) {
      console.error("Get domain error:", error);
      res.status(500).json({ error: "Failed to get domain", details: error.message });
    }
  });

  app.get("/api/domains", async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.json([]);
      }

      const domains = await storage.getDomainsByUserId(userId);
      
      const domainsWithStats = await Promise.all(
        domains.map(async (domain) => {
          const reports = await storage.getReportsByDomainId(domain.id);
          const latestReport = reports.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          return {
            ...domain,
            latestScan: latestReport ? {
              createdAt: latestReport.createdAt,
              status: (latestReport.scanJson as any).summary.overall,
              criticalIssues: (latestReport.scanJson as any).summary.criticalIssues,
            } : null,
          };
        })
      );

      res.json(domainsWithStats);
    } catch (error: any) {
      console.error("Get domains error:", error);
      res.status(500).json({ error: "Failed to get domains", details: error.message });
    }
  });

  app.delete("/api/domain/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const domain = await storage.getDomain(req.params.id);
      
      if (!domain || domain.userId !== user.id) {
        return res.status(404).json({ error: "Domain not found" });
      }

      await storage.deleteDomain(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete domain error:", error);
      res.status(500).json({ error: "Failed to delete domain", details: error.message });
    }
  });

  app.patch("/api/domain/:id/monitoring", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { enabled } = req.body;
      const domain = await storage.getDomain(req.params.id);
      
      if (!domain || domain.userId !== user.id) {
        return res.status(404).json({ error: "Domain not found" });
      }

      if (user.isPro !== "true" && enabled) {
        return res.status(403).json({ error: "Pro subscription required for automated monitoring" });
      }

      const updatedDomain = await storage.updateDomainMonitoring(req.params.id, enabled);
      res.json(updatedDomain);
    } catch (error: any) {
      console.error("Update monitoring error:", error);
      res.status(500).json({ error: "Failed to update monitoring", details: error.message });
    }
  });

  app.post("/api/monitoring/run", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.isPro !== "true") {
        return res.status(403).json({ error: "Pro subscription required for monitoring" });
      }

      const { runMonitoring } = await import("./jobs/monitor");
      await runMonitoring();
      res.json({ success: true, message: "Monitoring cycle completed" });
    } catch (error: any) {
      console.error("Manual monitoring error:", error);
      res.status(500).json({ error: "Failed to run monitoring", details: error.message });
    }
  });

  app.post("/api/report", async (req, res) => {
    try {
      const { domainId, scanJson } = req.body;

      if (!scanJson) {
        return res.status(400).json({ error: "scanJson is required" });
      }

      const slug = randomBytes(8).toString("hex");

      const parsedReport = insertReportSchema.parse({
        slug,
        domainId: domainId || null,
        scanJson,
      });

      const report = await storage.createReport(parsedReport);
      res.json(report);
    } catch (error: any) {
      console.error("Create report error:", error);
      res.status(400).json({ error: "Failed to create report", details: error.message });
    }
  });

  app.get("/api/report/:slug", async (req, res) => {
    try {
      const report = await storage.getReportBySlug(req.params.slug);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      const domain = report.domainId ? await storage.getDomain(report.domainId) : null;

      res.json({ report, domain });
    } catch (error: any) {
      console.error("Get report error:", error);
      res.status(500).json({ error: "Failed to get report", details: error.message });
    }
  });

  app.post("/api/template-lint", async (req, res) => {
    try {
      const { subject, html, text, userId } = req.body;

      if (!subject) {
        return res.status(400).json({ error: "Subject is required" });
      }

      const result = lintTemplate(subject, text || "", html || "");

      if (userId) {
        const parsedCheck = insertTemplateCheckSchema.parse({
          userId,
          subject,
          html,
          text,
          resultJson: result,
        });

        await storage.createTemplateCheck(parsedCheck);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Template lint error:", error);
      res.status(400).json({ error: "Failed to lint template", details: error.message });
    }
  });

  app.get("/api/template-checks", async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.json([]);
      }

      const checks = await storage.getTemplateChecksByUserId(userId);
      res.json(checks);
    } catch (error: any) {
      console.error("Get template checks error:", error);
      res.status(500).json({ error: "Failed to get template checks", details: error.message });
    }
  });

  app.post("/api/health", async (req, res) => {
    try {
      const { domainId, sent, openRate, spamRate, hardBounces, softBounces, note } = req.body;

      const parsedHealthPoint = insertHealthPointSchema.parse({
        domainId,
        sent,
        openRate,
        spamRate,
        hardBounces,
        softBounces,
        note,
      });

      const healthPoint = await storage.createHealthPoint(parsedHealthPoint);
      res.json(healthPoint);
    } catch (error: any) {
      console.error("Create health point error:", error);
      res.status(400).json({ error: "Failed to create health point", details: error.message });
    }
  });

  app.get("/api/health/:domainId", async (req, res) => {
    try {
      const healthPoints = await storage.getHealthPointsByDomainId(req.params.domainId);
      res.json(healthPoints);
    } catch (error: any) {
      console.error("Get health points error:", error);
      res.status(500).json({ error: "Failed to get health points", details: error.message });
    }
  });

  app.get("/api/version", (req, res) => {
    res.json({ version: "1.0.0", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
