import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export interface RequestWithPlanCheck extends Request {
  planLimit?: {
    plan: string;
    maxDomains: number;
    features: Record<string, boolean>;
  };
}

export function requireCapacity(resource: 'domains') {
  return async (req: RequestWithPlanCheck, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;
    const userId = user.id;
    const userPlan = user.plan || "Free";

    // Get plan limits
    const planLimit = await storage.getPlanLimit(userPlan);
    if (!planLimit) {
      return res.status(500).json({ error: "Plan configuration not found" });
    }

    // Check capacity based on resource type
    if (resource === 'domains') {
      const userDomains = await storage.getDomainsByUserId(userId);
      
      if (userDomains.length >= planLimit.maxDomains) {
        return res.status(403).json({
          error: "Domain limit reached",
          currentCount: userDomains.length,
          maxAllowed: planLimit.maxDomains,
          plan: userPlan,
          upgradeRequired: true,
        });
      }
    }

    // Attach plan info to request for later use
    req.planLimit = {
      plan: userPlan,
      maxDomains: planLimit.maxDomains,
      features: planLimit.features as Record<string, boolean>,
    };

    next();
  };
}

export function requireFeature(feature: string) {
  return async (req: RequestWithPlanCheck, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;
    const userPlan = user.plan || "Free";

    // Get plan limits
    const planLimit = await storage.getPlanLimit(userPlan);
    if (!planLimit) {
      return res.status(500).json({ error: "Plan configuration not found" });
    }

    const features = planLimit.features as Record<string, boolean>;
    
    if (!features[feature]) {
      return res.status(403).json({
        error: `Feature not available on ${userPlan} plan`,
        feature,
        plan: userPlan,
        upgradeRequired: true,
      });
    }

    next();
  };
}
