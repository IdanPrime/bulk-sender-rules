import cron from "node-cron";
import { storage } from "../storage";
import { scanDNS, type DNSScanResult } from "../lib/dns-scanner";
import { detectChanges } from "../services/diffChecker";
import { sendAlertEmail } from "../services/notify";

export async function runMonitoring() {
  console.log("[monitor] Starting automated DNS monitoring...");

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

        console.log(`[monitor] Scanning domain: ${domain.name}`);
        const scanResult = await scanDNS(domain.name);

        const latestScan = await storage.getLatestScanByDomainId(domain.id);

        await storage.createScan({
          domainId: domain.id,
          result: scanResult,
        });

        if (latestScan) {
          const changes = detectChanges(latestScan.result as DNSScanResult, scanResult);
          
          if (changes.length > 0) {
            console.log(`[monitor] ✓ Detected ${changes.length} changes for ${domain.name}`);
            
            for (const change of changes) {
              await storage.createAlert({
                domainId: domain.id,
                recordType: change.recordType,
                oldValue: change.oldValue,
                newValue: change.newValue,
              });

              await sendAlertEmail({
                to: user.email,
                domain: domain.name,
                recordType: change.recordType,
                oldValue: change.oldValue,
                newValue: change.newValue,
              });
            }
          } else {
            console.log(`[monitor] ✓ No changes detected for ${domain.name}`);
          }
        } else {
          console.log(`[monitor] ✓ First scan for ${domain.name}, no comparison`);
        }
      } catch (error) {
        console.error(`[monitor] ✗ Error scanning ${domain.name}:`, error);
      }
    }

    console.log("[monitor] ✓ Monitoring cycle completed");
  } catch (error) {
    console.error("[monitor] ✗ Monitoring error:", error);
  }
}

export function startMonitoring() {
  const intervalHours = parseInt(process.env.SCAN_INTERVAL_HOURS || "6", 10);
  const cronExpression = `0 */${intervalHours} * * *`;
  
  console.log(`[monitor] Scheduling monitoring every ${intervalHours} hours`);
  console.log(`[monitor] Cron expression: ${cronExpression}`);
  
  cron.schedule(cronExpression, async () => {
    console.log(`[monitor] Triggered at ${new Date().toISOString()}`);
    await runMonitoring();
  });

  console.log("[monitor] ✓ Monitoring scheduler started");
}
