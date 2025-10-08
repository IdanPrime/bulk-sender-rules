import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth-routes";
import { requireDomainAccess } from "../middleware/accessControl";
import { requireFeature } from "../middleware/planLimits";
import { logAuditEvent, AuditEvents } from "../services/auditLog";
import { randomBytes } from "crypto";

const router = Router();

// Create public report link
router.post("/domains/:id/public-report", 
  requireAuth,
  requireFeature("shareLinks"),
  requireDomainAccess(),
  async (req, res) => {
    try {
      const user = req.user as any;
      const { id: domainId } = req.params;
      const { runId, expiresInDays } = req.body;

      // Validate run belongs to domain
      const run = await storage.getScanRunsByDomainId(domainId, 1);
      if (!run || run.length === 0 || run[0].id !== runId) {
        return res.status(404).json({ error: "Scan run not found for this domain" });
      }

      // Generate unique token
      const token = randomBytes(16).toString("hex");

      // Calculate expiry if specified
      let expiresAt = null;
      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      const publicReport = await storage.createPublicReport({
        domainId,
        runId,
        token,
        expiresAt,
      });

      // Log audit event
      await logAuditEvent({
        actorUserId: user.id,
        event: AuditEvents.PUBLIC_LINK_CREATED,
        domainId,
        meta: {
          publicReportId: publicReport.id,
          runId,
          expiresAt: expiresAt?.toISOString(),
        },
      });

      res.json({
        ...publicReport,
        url: `/r/${token}`,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all public reports for a domain
router.get("/domains/:id/public-reports",
  requireAuth,
  requireDomainAccess(),
  async (req, res) => {
    const { id: domainId } = req.params;
    const publicReports = await storage.getPublicReportsByDomainId(domainId);
    res.json(publicReports);
  }
);

// Revoke public report
router.delete("/public-reports/:id",
  requireAuth,
  async (req, res) => {
    try {
      const user = req.user as any;
      const { id } = req.params;

      // Get public report to check ownership
      const publicReports = await storage.getPublicReportsByDomainId("");
      const publicReport = publicReports.find(r => r.id === id);

      if (!publicReport) {
        return res.status(404).json({ error: "Public report not found" });
      }

      // Check domain access
      const domain = await storage.getDomain(publicReport.domainId);
      if (!domain || domain.userId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deletePublicReport(id);

      // Log audit event
      await logAuditEvent({
        actorUserId: user.id,
        event: AuditEvents.PUBLIC_LINK_REVOKED,
        domainId: publicReport.domainId,
        meta: {
          publicReportId: id,
        },
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Public route to view report (no auth required)
router.get("/r/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const publicReport = await storage.getPublicReportByToken(token);
    
    if (!publicReport) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Check expiry
    if (publicReport.expiresAt && new Date(publicReport.expiresAt) < new Date()) {
      return res.status(404).json({ error: "Report link has expired" });
    }

    // Get scan run data
    const runs = await storage.getScanRunsByDomainId(publicReport.domainId);
    const run = runs.find(r => r.id === publicReport.runId);

    if (!run) {
      return res.status(404).json({ error: "Scan run not found" });
    }

    // Get scan records
    const records = await storage.getScanRecordsByRunId(run.id);

    // Get domain name
    const domain = await storage.getDomain(publicReport.domainId);

    res.json({
      domain: domain?.name || "Unknown",
      run: {
        id: run.id,
        status: run.status,
        score: run.score,
        scoreBreakdown: run.scoreBreakdown,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
      },
      records: records.map(r => ({
        type: r.recordType,
        selector: r.selector,
        verdict: r.verdict,
        value: r.rawValue,
        meta: r.metaJson,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
