import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface DomainCardProps {
  domain: string;
  lastScanDate: string;
  status: "PASS" | "WARN" | "FAIL";
  criticalIssues: number;
  onRescan?: () => void;
  onViewDetails?: () => void;
}

export default function DomainCard({
  domain,
  lastScanDate,
  status,
  criticalIssues,
  onRescan,
  onViewDetails,
}: DomainCardProps) {
  return (
    <Card className="p-6" data-testid={`card-domain-${domain}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2" data-testid={`text-domain-name-${domain}`}>
            {domain}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Last scan: {lastScanDate}
          </p>
          <StatusBadge status={status} />
        </div>
      </div>

      {criticalIssues > 0 && (
        <div className="mb-4 p-3 bg-destructive/10 rounded-md">
          <p className="text-sm text-destructive font-medium">
            {criticalIssues} critical {criticalIssues === 1 ? "issue" : "issues"} found
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onRescan}
          data-testid={`button-rescan-${domain}`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rescan
        </Button>
        <Button
          variant="default"
          className="flex-1"
          onClick={onViewDetails}
          data-testid={`button-view-details-${domain}`}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </div>
    </Card>
  );
}
