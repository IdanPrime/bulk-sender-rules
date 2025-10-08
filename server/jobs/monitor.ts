import cron from "node-cron";
import { storage } from "../storage";
import { runScan } from "../services/scanRunner";
import { sendAlertNotifications } from "../services/notifications";
import { logAuditEvent, AuditEvents } from "../services/auditLog";

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
        if (diff && (diff.severity === "fail" || diff.severity === "warn")) {
          console.log(`[monitor] ⚠ ${diff.severity.toUpperCase()} severity detected for ${domain.name}`);
          
          // Load alert preferences (domain-specific overrides global)
          const domainPrefs = await storage.getDomainAlertPref(domain.id);
          const globalPrefs = await storage.getAlertPref(domain.userId);
          
          // Merge preferences field-by-field (domain overrides global, with defaults)
          const mergedPrefs = {
            emailEnabled: (domainPrefs?.emailEnabled ?? globalPrefs?.emailEnabled ?? "true"),
            slackEnabled: (domainPrefs?.slackEnabled ?? globalPrefs?.slackEnabled ?? "false"),
            threshold: (domainPrefs?.threshold ?? globalPrefs?.threshold ?? "warn"),
          };
          
          // Check if severity meets threshold
          const thresholdMap: Record<string, number> = {
            info: 0,
            warn: 1,
            fail: 2,
          };
          
          const severityLevel = thresholdMap[diff.severity.toLowerCase()] || 0;
          const thresholdLevel = thresholdMap[mergedPrefs.threshold.toLowerCase()] || 1;
          
          if (severityLevel < thresholdLevel) {
            console.log(`[monitor] ℹ Severity ${diff.severity} below threshold ${mergedPrefs.threshold}, skipping alert`);
            continue;
          }
          
          // Create alert
          const changedCount = Array.isArray(diff.changedJson) ? diff.changedJson.length : 0;
          const addedCount = Array.isArray(diff.addedJson) ? diff.addedJson.length : 0;
          const removedCount = Array.isArray(diff.removedJson) ? diff.removedJson.length : 0;
          
          const alert = await storage.createAlert({
            domainId: domain.id,
            runId,
            type: "DNS_CHANGE_DETECTED",
            severity: diff.severity.toUpperCase(),
            title: `DNS Changes Detected for ${domain.name}`,
            body: `${changedCount} changed, ${addedCount} added, ${removedCount} removed records. Score: ${score}/100`,
            sentAt: new Date(),
          });
          
          // Send notifications to user's destinations (only if channels enabled)
          const shouldAttemptNotifications = mergedPrefs.slackEnabled === "true" || mergedPrefs.emailEnabled === "true";
          
          if (shouldAttemptNotifications) {
            try {
              const notificationsSent = await sendAlertNotifications(alert, domain.name, {
                emailEnabled: mergedPrefs.emailEnabled === "true",
                slackEnabled: mergedPrefs.slackEnabled === "true",
              });
              
              if (notificationsSent) {
                console.log(`[monitor] ✓ Sent notifications for ${domain.name}`);
                
                // Log audit event only when notifications actually sent
                await logAuditEvent({
                  actorUserId: domain.userId,
                  event: AuditEvents.ALERT_SENT,
                  domainId: domain.id,
                  meta: {
                    alertId: alert.id,
                    severity: diff.severity,
                    runId,
                    channels: {
                      email: mergedPrefs.emailEnabled === "true",
                      slack: mergedPrefs.slackEnabled === "true",
                    },
                  },
                });
              } else {
                console.log(`[monitor] ℹ No destinations available for ${domain.name}`);
              }
            } catch (error) {
              console.error(`[monitor] ✗ Failed to send notifications for ${domain.name}:`, error);
            }
          } else {
            console.log(`[monitor] ℹ Notifications disabled for ${domain.name}`);
          }
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
