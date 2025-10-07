import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { requireAuth } from "./auth-routes";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
    });
  } catch (e: any) {
    console.error("Failed to initialize Stripe:", e?.message);
  }
}

export function registerStripeRoutes(app: Express) {
  app.get("/api/billing/verify", async (req, res) => {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.redirect("/pricing?error=no_session");
    }

    const sk = process.env.STRIPE_SECRET_KEY;
    const baseUrl = (process.env.NEXTAUTH_URL || process.env.REPLIT_DEV_DOMAIN || "").replace(/\/$/, "");
    
    if (!baseUrl) {
      console.error("[billing.verify] Base URL not configured (NEXTAUTH_URL or REPLIT_DEV_DOMAIN required)");
      return res.status(500).send("Server configuration error: Base URL not set");
    }

    const formattedBaseUrl = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") 
      ? baseUrl 
      : `https://${baseUrl}`;

    if (!sk) {
      console.error("[billing.verify] STRIPE_SECRET_KEY missing");
      return res.redirect(`${formattedBaseUrl}/pricing?error=no_stripe_key`);
    }

    let stripeClient: Stripe;
    try {
      stripeClient = new Stripe(sk, { apiVersion: "2025-09-30.clover" });
    } catch (e: any) {
      console.error("[billing.verify] Stripe init failed:", e?.message);
      return res.redirect(`${formattedBaseUrl}/pricing?error=stripe_init_failed`);
    }

    try {
      const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "subscription"],
      });

      if (session.payment_status !== "paid") {
        console.error("[billing.verify] Payment not completed, status:", session.payment_status);
        return res.redirect(`${formattedBaseUrl}/pricing?error=payment_incomplete`);
      }

      const email =
        session.customer_details?.email ||
        (typeof session.customer === "object" && session.customer && "email" in session.customer ? session.customer.email : undefined);

      if (!email) {
        console.error("[billing.verify] No email found in session");
        return res.redirect(`${formattedBaseUrl}/pricing?error=no_email_on_session`);
      }

      const stripeCustomerId = typeof session.customer === "string" ? session.customer : (session.customer?.id || "");
      const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription?.id || "");

      if (!stripeCustomerId || !stripeSubscriptionId) {
        console.error("[billing.verify] Missing customer or subscription ID");
        return res.redirect(`${formattedBaseUrl}/pricing?error=missing_stripe_data`);
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.error("[billing.verify] User not found for email:", email);
        return res.redirect(`${formattedBaseUrl}/pricing?error=user_not_found`);
      }

      const updatedUser = await storage.upgradeUserToPro(user.id, stripeCustomerId, stripeSubscriptionId);
      console.log(`[billing.verify] ✓ User ${email} upgraded to Pro (isPro=${updatedUser.isPro})`);

      return res.redirect(`${formattedBaseUrl}/dashboard?upgraded=true`);
    } catch (e: any) {
      console.error("[billing.verify]", e?.message || e);
      return res.redirect(`${formattedBaseUrl}/pricing?error=verify_failed`);
    }
  });

  app.get("/api/billing/plan", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user || !user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userData = await storage.getUser(user.id);
      if (!userData) {
        console.error("[billing.plan] User not found in database:", user.id);
        return res.status(404).json({ error: "User not found" });
      }

      const plan = userData.isPro === "true" ? "pro" : "free";
      console.log(`[billing.plan] User ${userData.email}: plan=${plan}, isPro=${userData.isPro}`);
      
      res.json({ plan });
    } catch (error: any) {
      console.error("[billing.plan] Error fetching plan:", error);
      return res.status(500).json({ error: "Failed to fetch plan status" });
    }
  });

  app.get("/api/stripe/diag", async (req, res) => {
    const ok = (v?: string) => (v && v.length > 8 ? "present" : "missing");
    const baseUrl = process.env.NEXTAUTH_URL || process.env.REPLIT_DEV_DOMAIN || "";
    const formattedUrl = baseUrl.startsWith("https://") 
      ? baseUrl.replace(/\/$/, "")
      : (baseUrl ? `https://${baseUrl}` : "missing/invalid");
    
    res.json({
      stripeSecretKey: ok(process.env.STRIPE_SECRET_KEY),
      stripePublicKey: ok(process.env.VITE_STRIPE_PUBLIC_KEY),
      priceId: ok(process.env.STRIPE_PRICE_ID),
      nextauthUrl: formattedUrl
    });
  });

  app.post("/api/stripe/checkout", requireAuth, async (req, res) => {
    const sk = process.env.STRIPE_SECRET_KEY;
    const baseUrl = (process.env.NEXTAUTH_URL || process.env.REPLIT_DEV_DOMAIN || "").replace(/\/$/, "");
    
    if (!sk) {
      console.error("[checkout] STRIPE_SECRET_KEY missing");
      return res.status(400).json({ error: "STRIPE_SECRET_KEY missing" });
    }
    
    if (!baseUrl) {
      console.error("[checkout] NEXTAUTH_URL missing or invalid");
      return res.status(400).json({ error: "NEXTAUTH_URL missing or invalid" });
    }

    let stripeClient: Stripe;
    try {
      stripeClient = new Stripe(sk, { apiVersion: "2025-09-30.clover" });
    } catch (e: any) {
      console.error("[checkout] Stripe init failed:", e?.message);
      return res.status(500).json({ error: "Stripe init failed: " + e?.message });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const formattedBaseUrl = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") 
      ? baseUrl 
      : `https://${baseUrl}`;

    try {
      const session = await stripeClient.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: priceId ? [{ price: priceId, quantity: 1 }] : [{
          price_data: {
            currency: "usd",
            unit_amount: 1900,
            recurring: { interval: "month" },
            product_data: { name: "Deliverability Copilot Pro" }
          },
          quantity: 1
        }],
        success_url: `${formattedBaseUrl}/api/billing/verify?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${formattedBaseUrl}/pricing?canceled=true`,
      });
      
      if (!session?.url) {
        console.error("[checkout] No checkout URL returned from Stripe");
        return res.status(500).json({ error: "No checkout URL returned from Stripe" });
      }
      
      return res.json({ url: session.url });
    } catch (e: any) {
      console.error("[checkout] Stripe error:", e?.message || "unknown");
      return res.status(500).json({ error: "Stripe error: " + (e?.message || "unknown") });
    }
  });

  app.post("/api/get-or-create-subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      if (!user || !user.id || !user.email) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not initialized" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ["latest_invoice.payment_intent"],
        });
        
        if (subscription.status === "active" || subscription.status === "trialing") {
          return res.json({
            subscriptionId: subscription.id,
            status: "active",
            clientSecret: null,
          });
        }
        
        const latestInvoice = subscription.latest_invoice as any;
        
        return res.json({
          subscriptionId: subscription.id,
          status: subscription.status,
          clientSecret: latestInvoice?.payment_intent?.client_secret || null,
        });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
        });
        customerId = customer.id;
      }

      let productId = process.env.STRIPE_PRODUCT_ID;
      
      if (!productId) {
        const products = await stripe.products.list({ limit: 1 });
        if (products.data.length > 0 && products.data[0].name === "Deliverability Copilot Pro") {
          productId = products.data[0].id;
        } else {
          const product = await stripe.products.create({
            name: "Deliverability Copilot Pro",
          });
          productId = product.id;
        }
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: 1900,
              recurring: { interval: "month" },
              product: productId,
            },
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);

      const latestInvoice = subscription.latest_invoice as any;
      const paymentIntent = latestInvoice?.payment_intent as any;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || null,
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      res.status(500).json({ error: "Failed to create subscription", details: error.message });
    }
  });

  app.get("/api/subscription-status", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user || !user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      if (!user.stripeSubscriptionId) {
        return res.json({ isPro: false, status: "none" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not initialized" });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      const isPro = subscription.status === "active" || subscription.status === "trialing";
      
      if (user.isPro !== (isPro ? "true" : "false")) {
        await storage.updateUserProStatus(user.id, isPro);
      }

      res.json({ 
        isPro, 
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end 
      });
    } catch (error: any) {
      console.error("Subscription status error:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });
}
