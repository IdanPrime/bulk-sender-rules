import { Button } from "@/components/ui/button";
import { Share2, FileText } from "lucide-react";
import DNSRecordCard from "./DNSRecordCard";
import StatusBadge from "./StatusBadge";

interface ScanResultsProps {
  domain: string;
  overallStatus: "PASS" | "WARN" | "FAIL";
  criticalIssues: number;
  records: Array<{
    type: string;
    status: "PASS" | "WARN" | "FAIL";
    record?: string;
    issues?: string[];
    suggestions?: string[];
  }>;
  onGenerateReport?: () => void;
  onShare?: () => void;
}

export default function ScanResults({
  domain,
  overallStatus,
  criticalIssues,
  records,
  onGenerateReport,
  onShare,
}: ScanResultsProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-scan-domain">
              {domain}
            </h1>
            <div className="flex items-center gap-4">
              <StatusBadge status={overallStatus} />
              {criticalIssues > 0 && (
                <span className="text-sm text-destructive font-medium">
                  {criticalIssues} critical {criticalIssues === 1 ? "issue" : "issues"}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onShare}
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={onGenerateReport}
              data-testid="button-generate-report"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {records.map((record, index) => (
          <DNSRecordCard key={index} {...record} />
        ))}
      </div>
    </div>
  );
}
