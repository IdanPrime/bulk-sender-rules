import { storage } from "../storage";
import { scanDNS } from "./dns-scanner";

export async function runDailyRescans() {
  try {
    console.log("[CRON] Starting daily re-scans...");
    
    const allDomains = await Promise.all(
      (await storage.getDomainsByUserId("*")).map((domain) => domain)
    ).catch(() => []);

    for (const domain of allDomains) {
      try {
        const latestReports = await storage.getReportsByDomainId(domain.id);
        const previousReport = latestReports[0];

        const newScan = await scanDNS(domain.name);

        if (previousReport) {
          const oldSeverity = (previousReport.scanJson as any).summary?.overall || "PASS";
          const newSeverity = newScan.summary?.overall || "PASS";

          const severityLevel: Record<string, number> = {
            PASS: 0,
            WARNING: 1,
            FAIL: 2,
          };

          if (severityLevel[newSeverity] > severityLevel[oldSeverity]) {
            console.log(
              `[ALERT] Domain ${domain.name} status worsened from ${oldSeverity} to ${newSeverity}`
            );
          }
        }
      } catch (error) {
        console.error(`[CRON] Failed to re-scan ${domain.name}:`, error);
      }
    }

    console.log("[CRON] Daily re-scans completed");
    return { success: true, message: "Re-scans completed" };
  } catch (error) {
    console.error("[CRON] Re-scan job failed:", error);
    throw error;
  }
}
