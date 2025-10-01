import ScanResults from "@/components/ScanResults";

export default function ScanPage() {
  //todo: remove mock functionality
  const mockRecords = [
    {
      type: "SPF",
      status: "PASS" as const,
      record: "v=spf1 include:_spf.google.com ~all",
    },
    {
      type: "DKIM",
      status: "WARN" as const,
      record: "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4...",
      issues: ["Weak key size (1024-bit)"],
      suggestions: ["Upgrade to 2048-bit RSA key"],
    },
    {
      type: "DMARC",
      status: "FAIL" as const,
      issues: ["No DMARC record found"],
      suggestions: ["Add DMARC record: v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"],
    },
    {
      type: "BIMI",
      status: "FAIL" as const,
      issues: ["BIMI not configured"],
      suggestions: ["Optional: Add BIMI record for brand logo in inbox"],
    },
    {
      type: "MX",
      status: "PASS" as const,
      record: "10 mx1.example.com, 20 mx2.example.com",
    },
  ];

  return (
    <ScanResults
      domain="example.com"
      overallStatus="WARN"
      criticalIssues={2}
      records={mockRecords}
      onGenerateReport={() => console.log("Generate report")}
      onShare={() => console.log("Share")}
    />
  );
}
