import PublicReport from "@/components/PublicReport";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ReportPage() {
  const [, params] = useRoute("/report/:slug");
  const slug = params?.slug || "";

  const { data, isLoading } = useQuery({
    queryKey: ["/api/report", slug],
    queryFn: () => fetch(`/api/report/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8 p-4 bg-muted rounded-lg">
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-9 w-9" />
                </div>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.report) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center p-8">
            <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-2">404 - Report Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This report doesn't exist or may have expired.
            </p>
            <Link href="/dashboard">
              <Button data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scanData = data.report.scanJson;
  const records = [
    { type: "SPF", ...scanData.spf },
    ...(scanData.dkim.selectors || []).map((s: any) => ({
      type: `DKIM (${s.selector})`,
      status: s.status,
      record: s.record,
      issues: s.issues,
      suggestions: s.suggestions,
    })),
    { type: "DMARC", ...scanData.dmarc },
    { type: "BIMI", ...scanData.bimi },
    { type: "MX", ...scanData.mx },
  ];

  return (
    <PublicReport
      slug={slug}
      domain={scanData.domain}
      domainId={data.domain?.id}
      domainUserId={data.domain?.userId}
      scanDate={formatDistanceToNow(new Date(data.report.createdAt), { addSuffix: true })}
      overallStatus={scanData.summary.overall}
      records={records}
    />
  );
}
