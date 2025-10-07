import type { Express } from "express";
import express from "express";
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
    console.log(`[billing.verify] 🔍 Starting verification for session_id: ${sessionId}`);
    
    if (!sessionId) {
      console.error("[billing.verify] ❌ No session_id provided");
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
      console.log(`[billing.verify] 📡 Retrieving Stripe session...`);
      const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "subscription"],
      });

      console.log(`[billing.verify] 💳 Payment status: ${session.payment_status}`);
      if (session.payment_status !== "paid") {
        console.error("[billing.verify] ❌ Payment not completed, status:", session.payment_status);
        return res.redirect(`${formattedBaseUrl}/pricing?error=payment_incomplete`);
      }

      const email =
        session.customer_details?.email ||
        (typeof session.customer === "object" && session.customer && "email" in session.customer ? session.customer.email : undefined);

      console.log(`[billing.verify] 📧 Customer email: ${email}`);
      if (!email) {
        console.error("[billing.verify] ❌ No email found in session");
        return res.redirect(`${formattedBaseUrl}/pricing?error=no_email_on_session`);
      }

      const stripeCustomerId = typeof session.customer === "string" ? session.customer : (session.customer?.id || "");
      const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription?.id || "");

      console.log(`[billing.verify] 🆔 Stripe Customer ID: ${stripeCustomerId}`);
      console.log(`[billing.verify] 🆔 Stripe Subscription ID: ${stripeSubscriptionId}`);

      if (!stripeCustomerId || !stripeSubscriptionId) {
        console.error("[billing.verify] ❌ Missing customer or subscription ID");
        return res.redirect(`${formattedBaseUrl}/pricing?error=missing_stripe_data`);
      }

      console.log(`[billing.verify] 🔍 Looking up user by email: ${email}`);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.error("[billing.verify] ❌ User not found for email:", email);
        return res.redirect(`${formattedBaseUrl}/pricing?error=user_not_found`);
      }

      console.log(`[billing.verify] 👤 Found user: id=${user.id}, email=${user.email}, current isPro=${user.isPro}`);
      console.log(`[billing.verify] 💾 Writing to database: upgrading user to Pro...`);
      
      const updatedUser = await storage.upgradeUserToPro(user.id, stripeCustomerId, stripeSubscriptionId);
      
      console.log(`[billing.verify] ✅ Database write complete!`);
      console.log(`[billing.verify] 📊 Updated user data:`, {
        id: updatedUser.id,
        email: updatedUser.email,
        isPro: updatedUser.isPro,
        stripeCustomerId: updatedUser.stripeCustomerId,
        stripeSubscriptionId: updatedUser.stripeSubscriptionId
      });
      console.log(`[billing.verify] ✓ User ${email} successfully upgraded to Pro (isPro=${updatedUser.isPro})`);

      return res.redirect(`${formattedBaseUrl}/dashboard?upgraded=true`);
    } catch (e: any) {
      console.error("[billing.verify] ❌ Error:", e?.message || e);
      console.error("[billing.verify] Stack:", e?.stack);
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
      
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
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
    const user = req.user as any;
    if (!user || !user.id || !user.email) {
      console.error("[checkout] User not authenticated");
      return res.status(401).json({ error: "User not authenticated" });
    }

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
      console.log(`[checkout] Creating session for user: ${user.email} (id: ${user.id})`);
      
      const session = await stripeClient.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        client_reference_id: user.id,
        customer_email: user.email,
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
      
      console.log(`[checkout] ✓ Session created: ${session.id}, redirect URL: ${session.url}`);
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

  app.get("/api/billing/portal", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user || !user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const sk = process.env.STRIPE_SECRET_KEY;
      if (!sk) {
        console.error("[billing.portal] STRIPE_SECRET_KEY missing");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const stripeClient = new Stripe(sk, { apiVersion: "2025-09-30.clover" });
      const userData = await storage.getUser(user.id);
      
      if (!userData?.stripeCustomerId) {
        console.error("[billing.portal] No Stripe customer ID for user:", user.id);
        return res.status(400).json({ error: "No billing account found. Please subscribe first." });
      }

      const baseUrl = (process.env.NEXTAUTH_URL || process.env.REPLIT_DEV_DOMAIN || "").replace(/\/$/, "");
      const formattedBaseUrl = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") 
        ? baseUrl 
        : `https://${baseUrl}`;

      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: `${formattedBaseUrl}/dashboard`,
      });

      console.log(`[billing.portal] ✓ Portal session created for user ${user.email}`);
      return res.redirect(portalSession.url);
    } catch (error: any) {
      console.error("[billing.portal] Error:", error);
      return res.status(500).json({ error: "Failed to create billing portal session" });
    }
  });

  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    if (!sig) {
      console.error("[webhook] No signature provided");
      return res.status(400).send("No signature");
    }

    const sk = process.env.STRIPE_SECRET_KEY;
    if (!sk) {
      console.error("[webhook] STRIPE_SECRET_KEY missing");
      return res.status(500).send("Stripe not configured");
    }

    let event: Stripe.Event;
    try {
      const stripeClient = new Stripe(sk, { apiVersion: "2025-09-30.clover" });
      event = stripeClient.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      console.log(`[webhook] ✓ Verified event: ${event.type}`);
    } catch (err: any) {
      console.error("[webhook] Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[webhook] checkout.session.completed: ${session.id}`);
          
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          const clientReferenceId = session.client_reference_id;
          const email = session.customer_details?.email;

          if (clientReferenceId) {
            const user = await storage.getUser(clientReferenceId);
            if (user && customerId && subscriptionId) {
              await storage.upgradeUserToPro(user.id, customerId, subscriptionId);
              console.log(`[webhook] ✓ User ${user.email} upgraded to Pro via client_reference_id`);
            }
          } else if (email) {
            const user = await storage.getUserByEmail(email);
            if (user && customerId && subscriptionId) {
              await storage.upgradeUserToPro(user.id, customerId, subscriptionId);
              console.log(`[webhook] ✓ User ${email} upgraded to Pro via email`);
            }
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[webhook] customer.subscription.updated: ${subscription.id}, status: ${subscription.status}`);
          
          const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
          if (customerId) {
            const user = await storage.getUserByStripeCustomerId(customerId);
            if (user) {
              const isPro = ["active", "trialing", "past_due"].includes(subscription.status);
              await storage.updateUserProStatus(user.id, isPro);
              console.log(`[webhook] ✓ Updated user ${user.email} to isPro=${isPro} (status: ${subscription.status})`);
            } else {
              console.log(`[webhook] No user found with customer ID: ${customerId}`);
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[webhook] customer.subscription.deleted: ${subscription.id}`);
          
          const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
          if (customerId) {
            const user = await storage.getUserByStripeCustomerId(customerId);
            if (user) {
              await storage.updateUserProStatus(user.id, false);
              console.log(`[webhook] ✓ Downgraded user ${user.email} to free (subscription deleted)`);
            } else {
              console.log(`[webhook] No user found with customer ID: ${customerId}`);
            }
          }
          break;
        }

        default:
          console.log(`[webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("[webhook] Error processing event:", error);
      res.status(500).send("Webhook processing failed");
    }
  });
}
