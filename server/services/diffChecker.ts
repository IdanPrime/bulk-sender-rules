import type { DNSScanResult } from "../lib/dns-scanner";

interface RecordChange {
  recordType: string;
  oldValue: string;
  newValue: string;
}

export function detectChanges(oldScan: DNSScanResult, newScan: DNSScanResult): RecordChange[] {
  const changes: RecordChange[] = [];

  if (oldScan.spf?.record !== newScan.spf?.record) {
    changes.push({
      recordType: "SPF",
      oldValue: oldScan.spf?.record || "none",
      newValue: newScan.spf?.record || "none",
    });
  }

  const oldDkim = JSON.stringify(oldScan.dkim?.selectors || []);
  const newDkim = JSON.stringify(newScan.dkim?.selectors || []);
  if (oldDkim !== newDkim) {
    changes.push({
      recordType: "DKIM",
      oldValue: oldDkim,
      newValue: newDkim,
    });
  }

  if (oldScan.dmarc?.record !== newScan.dmarc?.record) {
    changes.push({
      recordType: "DMARC",
      oldValue: oldScan.dmarc?.record || "none",
      newValue: newScan.dmarc?.record || "none",
    });
  }

  if (oldScan.bimi?.record !== newScan.bimi?.record) {
    changes.push({
      recordType: "BIMI",
      oldValue: oldScan.bimi?.record || "none",
      newValue: newScan.bimi?.record || "none",
    });
  }

  if (oldScan.mx?.record !== newScan.mx?.record) {
    changes.push({
      recordType: "MX",
      oldValue: oldScan.mx?.record || "none",
      newValue: newScan.mx?.record || "none",
    });
  }

  return changes;
}
