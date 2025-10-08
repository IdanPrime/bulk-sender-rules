import PublicReport from "@/components/PublicReport";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Loader2 } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.report) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <p className="text-muted-foreground">Report not found</p>
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
