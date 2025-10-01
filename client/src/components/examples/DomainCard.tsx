import DomainCard from "../DomainCard";

export default function DomainCardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <DomainCard
        domain="example.com"
        lastScanDate="2 hours ago"
        status="PASS"
        criticalIssues={0}
        onRescan={() => console.log("Rescan triggered")}
        onViewDetails={() => console.log("View details triggered")}
      />
      <DomainCard
        domain="marketing.co"
        lastScanDate="1 day ago"
        status="WARN"
        criticalIssues={2}
        onRescan={() => console.log("Rescan triggered")}
        onViewDetails={() => console.log("View details triggered")}
      />
      <DomainCard
        domain="startup.io"
        lastScanDate="3 days ago"
        status="FAIL"
        criticalIssues={5}
        onRescan={() => console.log("Rescan triggered")}
        onViewDetails={() => console.log("View details triggered")}
      />
    </div>
  );
}
