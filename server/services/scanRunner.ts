import crypto from "crypto";
import type { IStorage } from "../storage";
import { scanDNS } from "../lib/dns-scanner";
import { calculateDeliverabilityScore } from "./scoring";
import { diffScanRecords } from "./diffEngine";

interface DnsRecord {
  type: string;
  selector?: string;
  value: string;
  verdict: "PASS" | "WARN" | "FAIL" | "INFO";
  meta?: Record<string, any>;
}

function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").substring(0, 16);
}

function normalizeRecords(scanResult: any): DnsRecord[] {
  const records: DnsRecord[] = [];

  if (scanResult.spf) {
    records.push({
      type: "spf",
      value: scanResult.spf.raw || "",
      verdict: scanResult.spf.status || "INFO",
      meta: {
        aligned: scanResult.spf.aligned,
        mechanisms: scanResult.spf.mechanisms,
      },
    });
  }

  if (scanResult.dkim && Array.isArray(scanResult.dkim.selectors)) {
    for (const sel of scanResult.dkim.selectors) {
      records.push({
        type: "dkim",
        selector: sel.selector,
        value: sel.raw || "",
        verdict: sel.status || "INFO",
        meta: { aligned: sel.aligned },
      });
    }
  }

  if (scanResult.dmarc) {
    records.push({
      type: "dmarc",
      value: scanResult.dmarc.raw || "",
      verdict: scanResult.dmarc.status || "INFO",
      meta: {
        policy: scanResult.dmarc.policy,
        pct: scanResult.dmarc.pct,
        aspf: scanResult.dmarc.aspf,
        adkim: scanResult.dmarc.adkim,
      },
    });
  }

  if (scanResult.bimi) {
    records.push({
      type: "bimi",
      value: scanResult.bimi.raw || "",
      verdict: scanResult.bimi.status || "INFO",
      meta: { location: scanResult.bimi.location },
    });
  }

  if (scanResult.mx && Array.isArray(scanResult.mx.records)) {
    for (const mx of scanResult.mx.records) {
      records.push({
        type: "mx",
        selector: mx.host,
        value: `${mx.priority} ${mx.host}`,
        verdict: scanResult.mx.status || "INFO",
        meta: { priority: mx.priority, host: mx.host },
      });
    }
  }

  return records;
}

export async function runScan(
  domainId: string,
  domain: string,
  storage: IStorage
): Promise<{ runId: string; score: number }> {
  const run = await storage.createScanRun({
    domainId,
    startedAt: new Date(),
    finishedAt: null,
    status: "running",
    errorText: null,
    score: null,
    scoreBreakdown: null,
  });

  const runId = run.id;

  try {
    const scanResult = await scanDNS(domain);
    const records = normalizeRecords(scanResult);

    for (const record of records) {
      await storage.createScanRecord({
        runId,
        recordType: record.type,
        selector: record.selector || null,
        valueHash: hashValue(record.value),
        rawValue: record.value,
        verdict: record.verdict,
        metaJson: record.meta || null,
      });
    }

    const { score, breakdown } = calculateDeliverabilityScore(scanResult);

    await storage.updateScanRun(runId, {
      status: "completed",
      finishedAt: new Date(),
      score,
      scoreBreakdown: breakdown,
    });

    const previousRuns = await storage.getScanRunsByDomainId(domainId, 2);
    if (previousRuns.length === 2) {
      const oldRun = previousRuns[1];
      const oldRecords = await storage.getScanRecordsByRunId(oldRun.id);
      const newRecords = await storage.getScanRecordsByRunId(runId);

      const diff = diffScanRecords(oldRecords, newRecords);

      if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
        await storage.createScanDiff({
          runId,
          addedJson: diff.added,
          removedJson: diff.removed,
          changedJson: diff.changed,
          severity: diff.severity,
        });
      }
    }

    return { runId, score };
  } catch (error: any) {
    await storage.updateScanRun(runId, {
      status: "failed",
      finishedAt: new Date(),
      errorText: error.message || "Unknown error",
    });
    throw error;
  }
}
