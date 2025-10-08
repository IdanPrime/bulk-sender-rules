import { type Express } from "express";
import bcrypt from "bcryptjs";
import { passport } from "./auth";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { trackEvent, AppEventType } from "./services/analytics";

const signupSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parsed.error.errors[0].message 
        });
      }

      const { email, password } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, passwordHash });

      // Track registration event
      await trackEvent(storage, AppEventType.USER_REGISTERED, user.id, { email: user.email });

      res.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ error: "Authentication failed" });
      }
      if (!user) {
        console.log("Login failed - no user:", info?.message);
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      console.log("Login successful for user:", user.email, "ID:", user.id);
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("req.logIn error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        
        console.log("req.logIn successful, session ID:", req.sessionID);
        console.log("Session before save:", { 
          sessionID: req.sessionID, 
          isAuthenticated: req.isAuthenticated(),
          userId: req.user ? (req.user as any).id : null 
        });
        
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ error: "Session save failed" });
          }
          
          console.log("Session saved successfully:", {
            sessionID: req.sessionID,
            isAuthenticated: req.isAuthenticated(),
            userId: req.user ? (req.user as any).id : null
          });
          
          // Track login event
          trackEvent(storage, AppEventType.USER_LOGIN, user.id, { email: user.email });
          
          return res.json({ success: true, user: { id: user.id, email: user.email } });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    console.log("Session check:", {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      userId: req.user ? (req.user as any).id : null
    });
    
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      res.json({ 
        authenticated: true, 
        user: { 
          id: user.id, 
          email: user.email,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          isPro: user.isPro
        } 
      });
    } else {
      res.json({ authenticated: false, user: null });
    }
  });
}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
