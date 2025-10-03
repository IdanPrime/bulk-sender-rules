import { promises as dns } from "dns";

export interface DNSRecordStatus {
  status: "PASS" | "WARN" | "FAIL";
  record?: string;
  issues: string[];
  suggestions: string[];
}

export interface DKIMSelectorResult {
  selector: string;
  status: "PASS" | "WARN" | "FAIL";
  record?: string;
  issues: string[];
  suggestions: string[];
}

export interface DNSScanResult {
  domain: string;
  spf: DNSRecordStatus;
  dkim: {
    status: "PASS" | "WARN" | "FAIL";
    selectors: DKIMSelectorResult[];
  };
  dmarc: DNSRecordStatus;
  bimi: DNSRecordStatus;
  mx: DNSRecordStatus;
  summary: {
    overall: "PASS" | "WARN" | "FAIL";
    criticalIssues: number;
  };
}

async function resolveTxt(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(domain);
    return records.map((r) => r.join(""));
  } catch (error) {
    return [];
  }
}

async function resolveMx(domain: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(domain);
    return records.map((r) => `${r.priority} ${r.exchange}`);
  } catch (error) {
    return [];
  }
}

export async function scanDNS(domain: string): Promise<DNSScanResult> {
  const result: DNSScanResult = {
    domain,
    spf: await scanSPF(domain),
    dkim: await scanDKIM(domain),
    dmarc: await scanDMARC(domain),
    bimi: await scanBIMI(domain),
    mx: await scanMX(domain),
    summary: { overall: "PASS", criticalIssues: 0 },
  };

  let criticalIssues = 0;
  let hasWarnings = false;

  if (result.spf.status === "FAIL") criticalIssues++;
  if (result.spf.status === "WARN") hasWarnings = true;

  if (result.dkim.status === "FAIL") criticalIssues++;
  if (result.dkim.status === "WARN") hasWarnings = true;

  if (result.dmarc.status === "FAIL") criticalIssues++;
  if (result.dmarc.status === "WARN") hasWarnings = true;

  if (result.mx.status === "FAIL") criticalIssues++;

  result.summary.criticalIssues = criticalIssues;
  
  if (criticalIssues > 0) {
    result.summary.overall = "FAIL";
  } else if (hasWarnings) {
    result.summary.overall = "WARN";
  } else {
    result.summary.overall = "PASS";
  }

  return result;
}

async function scanSPF(domain: string): Promise<DNSRecordStatus> {
  const records = await resolveTxt(domain);
  const spfRecords = records.filter((r) => r.startsWith("v=spf1"));

  if (spfRecords.length === 0) {
    return {
      status: "FAIL",
      issues: ["No SPF record found"],
      suggestions: [
        "Add an SPF record: v=spf1 include:_spf.google.com ~all",
        "Consult your email provider for their recommended SPF configuration",
      ],
    };
  }

  if (spfRecords.length > 1) {
    return {
      status: "FAIL",
      record: spfRecords[0],
      issues: ["Multiple SPF records found - only one is allowed"],
      suggestions: ["Combine all SPF records into a single record"],
    };
  }

  const spfRecord = spfRecords[0];
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!spfRecord.includes("include:") && !spfRecord.includes("ip4:") && !spfRecord.includes("ip6:")) {
    issues.push("SPF record doesn't specify any authorized senders");
    suggestions.push("Add include: or ip4:/ip6: mechanisms to authorize senders");
  }

  if (spfRecord.endsWith("+all")) {
    issues.push("SPF record ends with +all (allows all senders)");
    suggestions.push("Change +all to ~all (soft fail) or -all (hard fail)");
  }

  if (spfRecord.endsWith("?all")) {
    issues.push("SPF record ends with ?all (neutral policy)");
    suggestions.push("Change ?all to ~all (soft fail) or -all (hard fail)");
  }

  const lookups = (spfRecord.match(/include:/g) || []).length;
  if (lookups > 10) {
    issues.push(`SPF record has ${lookups} DNS lookups (max 10 allowed)`);
    suggestions.push("Reduce the number of include: statements to stay under the 10 lookup limit");
  }

  if (issues.length > 0) {
    return { status: "WARN", record: spfRecord, issues, suggestions };
  }

  return { status: "PASS", record: spfRecord, issues: [], suggestions: [] };
}

async function scanDKIM(domain: string): Promise<{ status: "PASS" | "WARN" | "FAIL"; selectors: DKIMSelectorResult[] }> {
  const commonSelectors = ["default", "google", "k1", "s1", "s2", "selector1", "selector2", "dkim"];
  const selectors: DKIMSelectorResult[] = [];

  for (const selector of commonSelectors) {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const records = await resolveTxt(dkimDomain);

    if (records.length > 0) {
      const dkimRecord = records[0];
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (dkimRecord.includes("k=rsa") && dkimRecord.match(/p=[A-Za-z0-9+/]{100,200}/)) {
        issues.push("Weak key size detected (likely 1024-bit)");
        suggestions.push("Upgrade to 2048-bit RSA key for better security");
      }

      selectors.push({
        selector,
        status: issues.length > 0 ? "WARN" : "PASS",
        record: dkimRecord.substring(0, 100) + "...",
        issues,
        suggestions,
      });
    }
  }

  if (selectors.length === 0) {
    return {
      status: "FAIL",
      selectors: [{
        selector: "none",
        status: "FAIL",
        issues: ["No DKIM records found"],
        suggestions: [
          "Add DKIM signing to your email infrastructure",
          "Check with your email provider for DKIM setup instructions",
          "Common selectors: default, google, k1, s1, selector1",
        ],
      }],
    };
  }

  const hasWarnings = selectors.some((s) => s.status === "WARN");
  return {
    status: hasWarnings ? "WARN" : "PASS",
    selectors,
  };
}

async function scanDMARC(domain: string): Promise<DNSRecordStatus> {
  const dmarcDomain = `_dmarc.${domain}`;
  const records = await resolveTxt(dmarcDomain);
  const dmarcRecords = records.filter((r) => r.startsWith("v=DMARC1"));

  if (dmarcRecords.length === 0) {
    return {
      status: "FAIL",
      issues: ["No DMARC record found"],
      suggestions: [
        "Add a DMARC record: v=DMARC1; p=quarantine; rua=mailto:dmarc@" + domain,
        "Start with p=none to monitor, then move to p=quarantine or p=reject",
      ],
    };
  }

  const dmarcRecord = dmarcRecords[0];
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (dmarcRecord.includes("p=none")) {
    issues.push("DMARC policy is set to 'none' (monitoring only)");
    suggestions.push("Change policy to 'quarantine' or 'reject' for enforcement");
  }

  if (!dmarcRecord.includes("rua=")) {
    issues.push("No aggregate reporting address (rua) configured");
    suggestions.push("Add rua=mailto:dmarc@" + domain + " to receive reports");
  }

  if (!dmarcRecord.includes("ruf=") && !dmarcRecord.includes("rua=")) {
    suggestions.push("Consider adding ruf= for forensic reports");
  }

  if (issues.length > 0) {
    return { status: "WARN", record: dmarcRecord, issues, suggestions };
  }

  return { status: "PASS", record: dmarcRecord, issues: [], suggestions: [] };
}

async function scanBIMI(domain: string): Promise<DNSRecordStatus> {
  const bimiDomain = `default._bimi.${domain}`;
  const records = await resolveTxt(bimiDomain);
  const bimiRecords = records.filter((r) => r.startsWith("v=BIMI1"));

  if (bimiRecords.length === 0) {
    return {
      status: "WARN",
      issues: ["No BIMI record found"],
      suggestions: [
        "BIMI is optional but displays your logo in supported email clients",
        "Requires verified mark certificate (VMC) from authorized providers",
      ],
    };
  }

  const bimiRecord = bimiRecords[0];
  return { status: "PASS", record: bimiRecord, issues: [], suggestions: [] };
}

async function scanMX(domain: string): Promise<DNSRecordStatus> {
  const mxRecords = await resolveMx(domain);

  if (mxRecords.length === 0) {
    return {
      status: "FAIL",
      issues: ["No MX records found"],
      suggestions: ["Add MX records to receive email for this domain"],
    };
  }

  return {
    status: "PASS",
    record: mxRecords.join(", "),
    issues: [],
    suggestions: [],
  };
}
