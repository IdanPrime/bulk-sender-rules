import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import DomainCard from "./DomainCard";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: domains = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/domains"],
    queryFn: () => fetch("/api/domains?userId=demo").then(r => r.json()),
  });

  const handleAddDomain = () => {
    const domain = prompt("Enter domain name:");
    if (domain) {
      fetch("/api/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: domain, userId: "demo" }),
      }).then(() => window.location.reload());
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Domains</h1>
          <p className="text-muted-foreground">
            Manage and monitor your domain deliverability
          </p>
        </div>
        <Button onClick={handleAddDomain} data-testid="button-add-domain">
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No domains yet</p>
          <Button onClick={handleAddDomain}>Add your first domain</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain: any) => (
            <DomainCard
              key={domain.id}
              domain={domain.name}
              lastScanDate={domain.latestScan ? formatDistanceToNow(new Date(domain.latestScan.createdAt), { addSuffix: true }) : "Never"}
              status={domain.latestScan?.status || "WARN"}
              criticalIssues={domain.latestScan?.criticalIssues || 0}
              onRescan={() => console.log(`Rescan ${domain.name}`)}
              onViewDetails={() => console.log(`View details ${domain.name}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
