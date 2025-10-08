import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth-routes";
import { requireFeature } from "../middleware/planLimits";
import { canAccessDomain } from "../middleware/accessControl";
import { logAuditEvent, AuditEvents } from "../services/auditLog";
import { insertTeamSchema, insertTeamMemberSchema } from "@shared/schema";

const router = Router();

// Get all teams for current user (owned or member of)
router.get("/", requireAuth, requireFeature("teams"), async (req, res) => {
  const user = req.user as any;
  
  const ownedTeams = await storage.getTeamsByUserId(user.id);
  const memberTeams = await storage.getTeamMembersByUserId(user.id);
  
  // Get full team details for member teams
  const memberTeamDetails = await Promise.all(
    memberTeams.map(async (tm) => {
      const team = await storage.getTeamById(tm.teamId);
      return { ...team, role: tm.role };
    })
  );

  res.json({
    owned: ownedTeams,
    member: memberTeamDetails.filter(t => t.id),
  });
});

// Create new team
router.post("/", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    
    const validatedData = insertTeamSchema.parse({
      ...req.body,
      ownerUserId: user.id,
    });

    const team = await storage.createTeam(validatedData);

    // Add owner as team member
    await storage.createTeamMember({
      teamId: team.id,
      userId: user.id,
      role: "owner",
    });

    // Log audit event
    await logAuditEvent({
      actorUserId: user.id,
      event: AuditEvents.TEAM_CREATED,
      meta: {
        teamId: team.id,
        teamName: team.name,
      },
    });

    res.json(team);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get team members
router.get("/:teamId/members", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    const { teamId } = req.params;

    // Check if user is team member or owner
    const team = await storage.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = await storage.getTeamMembersByTeamId(teamId);
    const isMember = members.some(m => m.userId === user.id) || team.ownerUserId === user.id;

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const userDetails = await storage.getUser(member.userId);
        return {
          ...member,
          email: userDetails?.email,
        };
      })
    );

    res.json(membersWithDetails);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add team member
router.post("/:teamId/members", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    const { teamId } = req.params;
    const { userId, role = "viewer" } = req.body;

    // Check if user is team owner or admin
    const team = await storage.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = await storage.getTeamMembersByTeamId(teamId);
    const currentMember = members.find(m => m.userId === user.id);
    
    const isOwner = team.ownerUserId === user.id;
    const isAdmin = currentMember?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only owners and admins can add members" });
    }

    const validatedData = insertTeamMemberSchema.parse({
      teamId,
      userId,
      role,
    });

    const member = await storage.createTeamMember(validatedData);

    // Log audit event
    await logAuditEvent({
      actorUserId: user.id,
      event: AuditEvents.TEAM_MEMBER_ADDED,
      meta: {
        teamId,
        newMemberId: userId,
        role,
      },
    });

    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update team member role
router.patch("/:teamId/members/:userId", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    const { teamId, userId } = req.params;
    const { role } = req.body;

    // Check if user is team owner or admin
    const team = await storage.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isOwner = team.ownerUserId === user.id;
    if (!isOwner) {
      return res.status(403).json({ error: "Only owners can change member roles" });
    }

    const updated = await storage.updateTeamMemberRole(teamId, userId, role);

    // Log audit event
    await logAuditEvent({
      actorUserId: user.id,
      event: AuditEvents.TEAM_MEMBER_ROLE_CHANGED,
      meta: {
        teamId,
        memberId: userId,
        newRole: role,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remove team member
router.delete("/:teamId/members/:userId", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    const { teamId, userId } = req.params;

    // Check if user is team owner or admin
    const team = await storage.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = await storage.getTeamMembersByTeamId(teamId);
    const currentMember = members.find(m => m.userId === user.id);
    
    const isOwner = team.ownerUserId === user.id;
    const isAdmin = currentMember?.role === "admin";

    if (!isOwner && !isAdmin && userId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await storage.deleteTeamMember(teamId, userId);

    // Log audit event
    await logAuditEvent({
      actorUserId: user.id,
      event: AuditEvents.TEAM_MEMBER_REMOVED,
      meta: {
        teamId,
        removedMemberId: userId,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add domain to team
router.post("/:teamId/domains", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    const { teamId } = req.params;
    const { domainId } = req.body;

    // Check if user is team owner or admin
    const team = await storage.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = await storage.getTeamMembersByTeamId(teamId);
    const currentMember = members.find(m => m.userId === user.id);
    
    const isOwner = team.ownerUserId === user.id;
    const isAdmin = currentMember?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only owners and admins can add domains" });
    }

    // Check if user has access to the domain
    const hasAccess = await canAccessDomain(user.id, domainId);
    if (!hasAccess) {
      return res.status(403).json({ error: "You don't have access to this domain" });
    }

    const teamDomain = await storage.createTeamDomain({
      teamId,
      domainId,
    });

    res.json(teamDomain);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remove domain from team
router.delete("/:teamId/domains/:domainId", requireAuth, requireFeature("teams"), async (req, res) => {
  try {
    const user = req.user as any;
    const { teamId, domainId } = req.params;

    // Check if user is team owner or admin
    const team = await storage.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = await storage.getTeamMembersByTeamId(teamId);
    const currentMember = members.find(m => m.userId === user.id);
    
    const isOwner = team.ownerUserId === user.id;
    const isAdmin = currentMember?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only owners and admins can remove domains" });
    }

    await storage.deleteTeamDomain(teamId, domainId);

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
