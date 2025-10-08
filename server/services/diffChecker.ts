interface DNSRecord {
  spf?: { value: string; status: string };
  dkim?: { value: string; status: string };
  dmarc?: { value: string; status: string };
  bimi?: { value: string; status: string };
  mx?: { records: any[]; status: string };
}

interface RecordChange {
  recordType: string;
  oldValue: string;
  newValue: string;
}

export function detectChanges(oldScan: DNSRecord, newScan: DNSRecord): RecordChange[] {
  const changes: RecordChange[] = [];

  if (oldScan.spf?.value !== newScan.spf?.value) {
    changes.push({
      recordType: "SPF",
      oldValue: oldScan.spf?.value || "none",
      newValue: newScan.spf?.value || "none",
    });
  }

  if (oldScan.dkim?.value !== newScan.dkim?.value) {
    changes.push({
      recordType: "DKIM",
      oldValue: oldScan.dkim?.value || "none",
      newValue: newScan.dkim?.value || "none",
    });
  }

  if (oldScan.dmarc?.value !== newScan.dmarc?.value) {
    changes.push({
      recordType: "DMARC",
      oldValue: oldScan.dmarc?.value || "none",
      newValue: newScan.dmarc?.value || "none",
    });
  }

  if (oldScan.bimi?.value !== newScan.bimi?.value) {
    changes.push({
      recordType: "BIMI",
      oldValue: oldScan.bimi?.value || "none",
      newValue: newScan.bimi?.value || "none",
    });
  }

  const oldMX = JSON.stringify(oldScan.mx?.records || []);
  const newMX = JSON.stringify(newScan.mx?.records || []);
  if (oldMX !== newMX) {
    changes.push({
      recordType: "MX",
      oldValue: oldMX,
      newValue: newMX,
    });
  }

  return changes;
}
