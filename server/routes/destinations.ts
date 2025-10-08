import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth-routes";
import { requireFeature } from "../middleware/planLimits";
import { validateWebhookUrl } from "../services/notifications";
import { logAuditEvent, AuditEvents } from "../services/auditLog";
import { insertDestinationSchema } from "@shared/schema";

const router = Router();

// Get all destinations for current user
router.get("/", requireAuth, requireFeature("webhook"), async (req, res) => {
  const user = req.user as any;
  const destinations = await storage.getDestinationsByUserId(user.id);
  res.json(destinations);
});

// Create new destination
router.post("/", requireAuth, requireFeature("webhook"), async (req, res) => {
  try {
    const user = req.user as any;
    
    // Validate input
    const validatedData = insertDestinationSchema.parse({
      ...req.body,
      userId: user.id,
    });

    // Validate URL for security
    if (!validateWebhookUrl(validatedData.url)) {
      return res.status(400).json({
        error: "Invalid webhook URL. Must be HTTPS and not point to private/internal addresses.",
      });
    }

    const destination = await storage.createDestination(validatedData);

    // Log audit event
    await logAuditEvent({
      actorUserId: user.id,
      event: AuditEvents.DESTINATION_ADDED,
      meta: {
        destinationId: destination.id,
        type: destination.type,
      },
    });

    res.json(destination);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update destination enabled status
router.patch("/:id/enabled", requireAuth, requireFeature("webhook"), async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const { enabled } = req.body;

    // Check ownership
    const destinations = await storage.getDestinationsByUserId(user.id);
    const destination = destinations.find(d => d.id === id);
    
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }

    const updated = await storage.updateDestinationEnabled(id, enabled);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete destination
router.delete("/:id", requireAuth, requireFeature("webhook"), async (req, res) => {
  try {
    const user = req.user as any;
    const { id } = req.params;

    // Check ownership
    const destinations = await storage.getDestinationsByUserId(user.id);
    const destination = destinations.find(d => d.id === id);
    
    if (!destination) {
      return res.status(404).json({ error: "Destination not found" });
    }

    await storage.deleteDestination(id);

    // Log audit event
    await logAuditEvent({
      actorUserId: user.id,
      event: AuditEvents.DESTINATION_DELETED,
      meta: {
        destinationId: id,
        type: destination.type,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
