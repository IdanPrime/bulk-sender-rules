import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { requireAuth } from "./auth-routes";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

export function registerStripeRoutes(app: Express) {
  app.post("/api/get-or-create-subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      if (!user || !user.id || !user.email) {
        return res.status(401).json({ error: "User not authenticated" });
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
