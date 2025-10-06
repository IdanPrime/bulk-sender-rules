import { type Express } from "express";
import bcrypt from "bcryptjs";
import { passport } from "./auth";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

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

      res.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ success: true, user: { id: user.id, email: user.email } });
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
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      res.json({ 
        authenticated: true, 
        user: { id: user.id, email: user.email } 
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
