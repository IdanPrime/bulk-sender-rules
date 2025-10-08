import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export interface AccessControlRequest extends Request {
  hasAccess?: boolean;
  userRole?: string;
}

/**
 * Check if user can access a domain
 * User has access if they are the owner OR a team member with access to the domain
 */
export async function canAccessDomain(userId: string, domainId: string): Promise<boolean> {
  // Check direct ownership
  const domain = await storage.getDomain(domainId);
  if (!domain) return false;
  
  if (domain.userId === userId) {
    return true;
  }

  // Check team access
  const teamDomains = await storage.getTeamDomainsByDomainId(domainId);
  
  for (const teamDomain of teamDomains) {
    const teamMembers = await storage.getTeamMembersByTeamId(teamDomain.teamId);
    const isMember = teamMembers.some(member => member.userId === userId);
    if (isMember) {
      return true;
    }
  }

  return false;
}

/**
 * Get user's role for a specific domain
 * Returns 'owner' if domain owner, or team role if team member
 */
export async function getUserDomainRole(userId: string, domainId: string): Promise<string | null> {
  // Check direct ownership
  const domain = await storage.getDomain(domainId);
  if (!domain) return null;
  
  if (domain.userId === userId) {
    return 'owner';
  }

  // Check team access and get role
  const teamDomains = await storage.getTeamDomainsByDomainId(domainId);
  
  for (const teamDomain of teamDomains) {
    const teamMembers = await storage.getTeamMembersByTeamId(teamDomain.teamId);
    const member = teamMembers.find(m => m.userId === userId);
    if (member) {
      return member.role;
    }
  }

  return null;
}

/**
 * Middleware to require domain access
 * Expects domainId in req.params.id or req.params.domainId
 */
export function requireDomainAccess() {
  return async (req: AccessControlRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;
    const userId = user.id;
    const domainId = req.params.id || req.params.domainId;

    if (!domainId) {
      return res.status(400).json({ error: "Domain ID required" });
    }

    const hasAccess = await canAccessDomain(userId, domainId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this domain" });
    }

    const role = await getUserDomainRole(userId, domainId);
    req.hasAccess = true;
    req.userRole = role || undefined;

    next();
  };
}

/**
 * Middleware to require specific role for domain
 * Expects domainId in req.params.id or req.params.domainId
 */
export function requireDomainRole(requiredRole: 'owner' | 'admin' | 'viewer') {
  return async (req: AccessControlRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;
    const userId = user.id;
    const domainId = req.params.id || req.params.domainId;

    if (!domainId) {
      return res.status(400).json({ error: "Domain ID required" });
    }

    const role = await getUserDomainRole(userId, domainId);
    
    if (!role) {
      return res.status(403).json({ error: "Access denied to this domain" });
    }

    // Role hierarchy: owner > admin > viewer
    const roleHierarchy: Record<string, number> = {
      owner: 3,
      admin: 2,
      viewer: 1,
    };

    const userLevel = roleHierarchy[role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `${requiredRole} role required`,
        userRole: role,
      });
    }

    req.userRole = role;
    next();
  };
}
