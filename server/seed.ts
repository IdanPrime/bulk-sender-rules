import { db } from "./db";
import { users, domains } from "@shared/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Clear existing test data (optional - comment out if you want to preserve data)
    console.log("Clearing existing seed test data...");
    // Delete domains created by this seed script
    await db.delete(domains).where(sql`
      name IN (
        'demo-free.com',
        'demo-pro-1.com', 'demo-pro-2.com', 'demo-pro-3.com',
        'example-agency-1.com', 'example-agency-2.com', 'example-agency-3.com', 
        'example-agency-4.com', 'example-agency-5.com'
      )
    `);
    // Delete test users created by this seed script
    await db.delete(users).where(sql`
      email IN (
        'test-free@example.com',
        'test-pro@example.com',
        'test-agency@example.com'
      )
    `);
    console.log("✓ Cleared seed test data\n");

    // Password: "password123" (hashed)
    const passwordHash = await bcrypt.hash("password123", 10);

    // ========================================================================
    // FREE TIER USER
    // ========================================================================
    console.log("Creating Free tier user...");
    const [freeUser] = await db
      .insert(users)
      .values({
        email: "test-free@example.com",
        passwordHash,
        plan: "Free",
        isPro: "false",
      })
      .returning();
    console.log(`✓ Created user: ${freeUser.email} (ID: ${freeUser.id})`);

    // Create 1 domain for Free user (limit: 1)
    const [freeDomain] = await db
      .insert(domains)
      .values({
        name: "demo-free.com",
        userId: freeUser.id,
        monitoringEnabled: "false",
      })
      .returning();
    console.log(`  └─ Domain: ${freeDomain.name}\n`);

    // ========================================================================
    // PRO TIER USER
    // ========================================================================
    console.log("Creating Pro tier user...");
    const [proUser] = await db
      .insert(users)
      .values({
        email: "test-pro@example.com",
        passwordHash,
        plan: "Pro",
        isPro: "true",
        stripeCustomerId: "cus_test_pro_123",
        stripeSubscriptionId: "sub_test_pro_456",
      })
      .returning();
    console.log(`✓ Created user: ${proUser.email} (ID: ${proUser.id})`);

    // Create 3 domains for Pro user (limit: 10)
    const proDomains = await db
      .insert(domains)
      .values([
        {
          name: "demo-pro-1.com",
          userId: proUser.id,
          monitoringEnabled: "true",
        },
        {
          name: "demo-pro-2.com",
          userId: proUser.id,
          monitoringEnabled: "true",
        },
        {
          name: "demo-pro-3.com",
          userId: proUser.id,
          monitoringEnabled: "false",
        },
      ])
      .returning();
    proDomains.forEach((d) => console.log(`  └─ Domain: ${d.name} (monitoring: ${d.monitoringEnabled})`));
    console.log("");

    // ========================================================================
    // AGENCY TIER USER
    // ========================================================================
    console.log("Creating Agency tier user...");
    const [agencyUser] = await db
      .insert(users)
      .values({
        email: "test-agency@example.com",
        passwordHash,
        plan: "Agency",
        isPro: "true",
        stripeCustomerId: "cus_test_agency_123",
        stripeSubscriptionId: "sub_test_agency_456",
      })
      .returning();
    console.log(`✓ Created user: ${agencyUser.email} (ID: ${agencyUser.id})`);

    // Create 5 domains for Agency user (unlimited)
    const agencyDomains = await db
      .insert(domains)
      .values([
        {
          name: "example-agency-1.com",
          userId: agencyUser.id,
          monitoringEnabled: "true",
        },
        {
          name: "example-agency-2.com",
          userId: agencyUser.id,
          monitoringEnabled: "true",
        },
        {
          name: "example-agency-3.com",
          userId: agencyUser.id,
          monitoringEnabled: "true",
        },
        {
          name: "example-agency-4.com",
          userId: agencyUser.id,
          monitoringEnabled: "false",
        },
        {
          name: "example-agency-5.com",
          userId: agencyUser.id,
          monitoringEnabled: "true",
        },
      ])
      .returning();
    agencyDomains.forEach((d) => console.log(`  └─ Domain: ${d.name} (monitoring: ${d.monitoringEnabled})`));
    console.log("");

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("✅ Seed completed successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 TEST ACCOUNTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("🆓 FREE TIER");
    console.log("   Email:    test-free@example.com");
    console.log("   Password: password123");
    console.log("   Domains:  1 (demo-free.com)");
    console.log("");
    console.log("⭐ PRO TIER");
    console.log("   Email:    test-pro@example.com");
    console.log("   Password: password123");
    console.log("   Domains:  3 (2 monitored)");
    console.log("");
    console.log("🏢 AGENCY TIER");
    console.log("   Email:    test-agency@example.com");
    console.log("   Password: password123");
    console.log("   Domains:  5 (4 monitored)");
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
