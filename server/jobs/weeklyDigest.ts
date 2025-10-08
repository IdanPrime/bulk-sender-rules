import cron from "node-cron";
import { storage } from "../storage";
import { sendWeeklyDigest, DigestData } from "../services/weeklyDigest";
import { formatDistanceToNow } from "date-fns";

export async function runWeeklyDigest() {
  console.log("[weekly-digest] Starting weekly digest generation...");

  try {
    // Get all monitored domains (these belong to Pro/Agency users)
    const monitoredDomains = await storage.getMonitoredDomains();
    
    // Get unique user IDs
    const userIds = Array.from(new Set(monitoredDomains.map(d => d.userId).filter((id): id is string => !!id)));
    console.log(`[weekly-digest] Found ${userIds.length} users with monitored domains`);

    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (!user) continue;
      try {
        // Check user alert preferences
        const alertPref = await storage.getAlertPref(user.id);
        if (alertPref && alertPref.emailEnabled === "false") {
          console.log(`[weekly-digest] ℹ Skipping ${user.email} (email disabled)`);
          continue;
        }

        // Get user's domains
        const userDomains = await storage.getDomainsByUserId(user.id);
        if (userDomains.length === 0) {
          console.log(`[weekly-digest] ℹ Skipping ${user.email} (no domains)`);
          continue;
        }

        // Calculate 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get weekly stats
        const weeklyScans = await storage.getScansSince(user.id, sevenDaysAgo);
        const weeklyAlerts = await storage.getAlertsSince(user.id, sevenDaysAgo);

        // Build domain data
        const domainData = await Promise.all(
          userDomains.map(async (domain) => {
            const latestScan = await storage.getLatestScanRunByDomainId(domain.id);
            const domainAlerts = weeklyAlerts.filter(a => a.domainId === domain.id);

            let score = 0;
            let status: "pass" | "warn" | "fail" = "pass";

            if (latestScan) {
              score = latestScan.score || 0;
              if (score >= 80) status = "pass";
              else if (score >= 60) status = "warn";
              else status = "fail";
            }

            return {
              name: domain.name,
              score,
              lastScanned: latestScan 
                ? formatDistanceToNow(new Date(latestScan.createdAt), { addSuffix: true })
                : "Never",
              alertCount: domainAlerts.length,
              status,
            };
          })
        );

        // Calculate average score
        const scoresWithData = domainData.filter(d => d.score > 0).map(d => d.score);
        const avgScore = scoresWithData.length > 0
          ? Math.round(scoresWithData.reduce((a, b) => a + b, 0) / scoresWithData.length)
          : 0;

        const digestData: DigestData = {
          userName: user.email.split('@')[0],
          userEmail: user.email,
          domains: domainData,
          weeklyStats: {
            totalScans: weeklyScans.length,
            totalAlerts: weeklyAlerts.length,
            avgScore,
          },
        };

        // Send digest email
        await sendWeeklyDigest(storage, user.id, digestData);
        console.log(`[weekly-digest] ✓ Sent digest to ${user.email}`);

      } catch (error) {
        console.error(`[weekly-digest] ✗ Error processing ${user.email}:`, error);
      }
    }

    console.log("[weekly-digest] ✓ Weekly digest generation completed");
  } catch (error) {
    console.error("[weekly-digest] ✗ Fatal error:", error);
  }
}

// Schedule weekly digest for every Monday at 9 AM UTC
export function scheduleWeeklyDigest() {
  console.log("[weekly-digest] Scheduling weekly digest for Mondays at 9:00 UTC");
  console.log("[weekly-digest] Cron expression: 0 9 * * 1");

  cron.schedule("0 9 * * 1", async () => {
    console.log("[weekly-digest] Cron triggered - running weekly digest");
    await runWeeklyDigest();
  });

  console.log("[weekly-digest] ✓ Weekly digest scheduler started");
}
