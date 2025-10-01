import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DomainCard from "./DomainCard";

export default function Dashboard() {
  //todo: remove mock functionality
  const mockDomains = [
    {
      domain: "example.com",
      lastScanDate: "2 hours ago",
      status: "PASS" as const,
      criticalIssues: 0,
    },
    {
      domain: "marketing.co",
      lastScanDate: "1 day ago",
      status: "WARN" as const,
      criticalIssues: 2,
    },
    {
      domain: "startup.io",
      lastScanDate: "3 days ago",
      status: "FAIL" as const,
      criticalIssues: 5,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Domains</h1>
          <p className="text-muted-foreground">
            Manage and monitor your domain deliverability
          </p>
        </div>
        <Button data-testid="button-add-domain">
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockDomains.map((domain) => (
          <DomainCard
            key={domain.domain}
            {...domain}
            onRescan={() => console.log(`Rescan ${domain.domain}`)}
            onViewDetails={() => console.log(`View details ${domain.domain}`)}
          />
        ))}
      </div>
    </div>
  );
}
