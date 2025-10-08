import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Database, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageData {
  plan: string;
  domains: {
    current: number;
    limit: number;
    percentage: number;
  };
  alerts: {
    last30Days: number;
  };
  scans: {
    last30Days: number;
  };
}

export default function UsageWidget() {
  const { data: usage, isLoading } = useQuery<UsageData>({
    queryKey: ["/api/user/usage"],
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="mb-6" data-testid="card-usage-widget">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-2 w-full max-w-md" />
            </div>
            <div className="flex gap-6">
              <Skeleton className="h-12 w-20" />
              <Skeleton className="h-12 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const isUnlimited = usage.domains.limit === -1;
  const isNearLimit = usage.domains.percentage >= 80 && !isUnlimited;

  return (
    <Card className="mb-6" data-testid="card-usage-widget">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium" data-testid="text-domain-usage">
                {isUnlimited ? (
                  <>
                    <span className="text-foreground">{usage.domains.current}</span>
                    <span className="text-muted-foreground"> domains</span>
                    <span className="text-muted-foreground ml-2">(unlimited)</span>
                  </>
                ) : (
                  <>
                    <span className="text-foreground">{usage.domains.current}</span>
                    <span className="text-muted-foreground"> of </span>
                    <span className="text-foreground">{usage.domains.limit}</span>
                    <span className="text-muted-foreground"> domains used</span>
                  </>
                )}
              </p>
              {isNearLimit && (
                <AlertCircle className="h-4 w-4 text-amber-500" data-testid="icon-near-limit" />
              )}
            </div>
            {!isUnlimited && (
              <Progress
                value={usage.domains.percentage}
                className="h-2"
                data-testid="progress-domain-usage"
              />
            )}
          </div>

          <div className="flex gap-6 items-center">
            <div className="text-center" data-testid="stat-alerts">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Alerts</p>
              </div>
              <p className="text-lg font-semibold" data-testid="text-alert-count">
                {usage.alerts.last30Days}
              </p>
              <p className="text-xs text-muted-foreground">30 days</p>
            </div>

            <div className="text-center" data-testid="stat-scans">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Scans</p>
              </div>
              <p className="text-lg font-semibold" data-testid="text-scan-count">
                {usage.scans.last30Days}
              </p>
              <p className="text-xs text-muted-foreground">30 days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
