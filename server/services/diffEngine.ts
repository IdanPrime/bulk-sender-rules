import type { ScanRecord } from "@shared/schema";
import crypto from "crypto";

interface DiffResult {
  added: Array<{ recordType: string; selector: string | null; value: string }>;
  removed: Array<{ recordType: string; selector: string | null; value: string }>;
  changed: Array<{ recordType: string; selector: string | null; oldValue: string; newValue: string }>;
  severity: "info" | "warn" | "fail";
}

function generateValueHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").substring(0, 16);
}

export function diffScanRecords(
  oldRecords: ScanRecord[],
  newRecords: ScanRecord[]
): DiffResult {
  const oldMap = new Map<string, ScanRecord>();
  const newMap = new Map<string, ScanRecord>();

  for (const record of oldRecords) {
    const key = `${record.recordType}:${record.selector || ""}`;
    oldMap.set(key, record);
  }

  for (const record of newRecords) {
    const key = `${record.recordType}:${record.selector || ""}`;
    newMap.set(key, record);
  }

  const added: Array<{ recordType: string; selector: string | null; value: string }> = [];
  const removed: Array<{ recordType: string; selector: string | null; value: string }> = [];
  const changed: Array<{ recordType: string; selector: string | null; oldValue: string; newValue: string }> = [];

  for (const [key, newRecord] of newMap) {
    const oldRecord = oldMap.get(key);
    if (!oldRecord) {
      added.push({
        recordType: newRecord.recordType,
        selector: newRecord.selector,
        value: newRecord.rawValue,
      });
    } else if (oldRecord.valueHash !== newRecord.valueHash) {
      changed.push({
        recordType: newRecord.recordType,
        selector: newRecord.selector,
        oldValue: oldRecord.rawValue,
        newValue: newRecord.rawValue,
      });
    }
  }

  for (const [key, oldRecord] of oldMap) {
    if (!newMap.has(key)) {
      removed.push({
        recordType: oldRecord.recordType,
        selector: oldRecord.selector,
        value: oldRecord.rawValue,
      });
    }
  }

  let severity: "info" | "warn" | "fail" = "info";

  for (const record of [...oldRecords, ...newRecords]) {
    if (record.verdict === "FAIL") {
      severity = "fail";
      break;
    }
    if (record.verdict === "WARN" && severity !== "fail") {
      severity = "warn";
    }
  }

  if (changed.length > 0 && severity === "info") {
    severity = "warn";
  }

  return { added, removed, changed, severity };
}

export { generateValueHash };
