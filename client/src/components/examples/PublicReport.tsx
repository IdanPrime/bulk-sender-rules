import PublicReport from "../PublicReport";

export default function PublicReportExample() {
  const mockRecords = [
    {
      type: "SPF",
      status: "PASS" as const,
      record: "v=spf1 include:_spf.google.com ~all",
    },
    {
      type: "DKIM",
      status: "PASS" as const,
      record: "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4...",
    },
    {
      type: "DMARC",
      status: "WARN" as const,
      record: "v=DMARC1; p=none; rua=mailto:dmarc@example.com",
      issues: ["Policy set to 'none'"],
      suggestions: ["Change to 'quarantine' or 'reject'"],
    },
    {
      type: "MX",
      status: "PASS" as const,
      record: "10 mx1.example.com",
    },
  ];

  return (
    <PublicReport
      domain="example.com"
      scanDate="Oct 1, 2025"
      overallStatus="PASS"
      records={mockRecords}
    />
  );
}
