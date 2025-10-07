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
    const formattedBaseUrl = baseUrl.startsWith("https://") ? baseUrl : `https://${baseUrl}`;

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
        success_url: `${formattedBaseUrl}/dashboard?upgraded=true`,
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
