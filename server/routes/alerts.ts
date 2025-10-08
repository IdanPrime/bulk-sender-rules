import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth-routes";

export function registerAlertRoutes(app: Express) {
  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const alerts = await storage.getAlertsByUserId(user.id);
      res.json(alerts);
    } catch (error: any) {
      console.error("Get alerts error:", error);
      res.status(500).json({ error: "Failed to get alerts", details: error.message });
    }
  });

  app.get("/api/alerts/:domainId", requireAuth, async (req, res) => {
    try {
      const { domainId } = req.params;
      const user = req.user as any;

      const domain = await storage.getDomain(domainId);
      if (!domain || domain.userId !== user.id) {
        return res.status(404).json({ error: "Domain not found" });
      }

      const alerts = await storage.getAlertsByDomainId(domainId);
      res.json(alerts);
    } catch (error: any) {
      console.error("Get domain alerts error:", error);
      res.status(500).json({ error: "Failed to get alerts", details: error.message });
    }
  });
}
