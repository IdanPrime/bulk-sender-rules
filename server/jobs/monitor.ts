import cron from "node-cron";
import { storage } from "../storage";
import { runScan } from "../services/scanRunner";

function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export async function runMonitoring() {
  console.log("[monitor] Starting daily DNS monitoring...");

  try {
    const monitoredDomains = await storage.getMonitoredDomains();
    console.log(`[monitor] Found ${monitoredDomains.length} monitored domains`);

    for (const domain of monitoredDomains) {
      try {
        if (!domain.userId) {
          console.log(`[monitor] ⚠ Skipping domain ${domain.name} (no user)`);
          continue;
        }

        const user = await storage.getUser(domain.userId);
        if (!user) {
          console.log(`[monitor] ⚠ User not found for domain ${domain.name}`);
          continue;
        }

        if (user.isPro !== "true") {
          console.log(`[monitor] ⚠ Skipping domain ${domain.name} (user not Pro)`);
          continue;
        }

        const today = getTodayDate();
        const existingRun = await storage.getScanRunByDomainIdAndDate(domain.id, today);
        
        if (existingRun) {
          console.log(`[monitor] ℹ Already scanned ${domain.name} today, skipping`);
          continue;
        }

        console.log(`[monitor] Scanning domain: ${domain.name}`);
        const { runId, score } = await runScan(domain.id, domain.name, storage);
        
        console.log(`[monitor] ✓ Completed scan for ${domain.name} (runId: ${runId}, score: ${score})`);
        
        const diff = await storage.getLatestScanDiffByDomainId(domain.id);
        if (diff && diff.severity === "fail") {
          console.log(`[monitor] ⚠ FAIL severity detected for ${domain.name}`);
        } else if (diff && diff.severity === "warn") {
          console.log(`[monitor] ⚠ WARN severity detected for ${domain.name}`);
        }
      } catch (error) {
        console.error(`[monitor] ✗ Error scanning ${domain.name}:`, error);
      }
    }

    console.log("[monitor] ✓ Daily monitoring cycle completed");
  } catch (error) {
    console.error("[monitor] ✗ Monitoring error:", error);
  }
}

export function startMonitoring() {
  const cronExpression = "0 0 * * *";
  
  console.log("[monitor] Scheduling daily monitoring at midnight UTC");
  console.log(`[monitor] Cron expression: ${cronExpression}`);
  
  cron.schedule(cronExpression, async () => {
    console.log(`[monitor] Daily scan triggered at ${new Date().toISOString()}`);
    await runMonitoring();
  }, {
    timezone: "UTC"
  });

  console.log("[monitor] ✓ Daily monitoring scheduler started");
}
