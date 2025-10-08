import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import DNSRecordCard from "./DNSRecordCard";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PublicReportProps {
  slug: string;
  domain: string;
  scanDate: string;
  overallStatus: "PASS" | "WARN" | "FAIL";
  records: Array<{
    type: string;
    status: "PASS" | "WARN" | "FAIL";
    record?: string;
    issues?: string[];
    suggestions?: string[];
  }>;
}

export default function PublicReport({
  slug,
  domain,
  scanDate,
  overallStatus,
  records,
}: PublicReportProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const { data: planData } = useQuery<{ plan: string; features: Record<string, boolean> }>({
    queryKey: ["/api/billing/plan"],
    enabled: isAuthenticated,
  });

  const downloadPdfMutation = useMutation({
    mutationFn: async (teamId?: string) => {
      const res = await apiRequest("POST", `/api/reports/${slug}/export`, {
        teamId: teamId || undefined,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${domain}-deliverability-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF Downloaded",
        description: "Your deliverability report has been downloaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Unable to download PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Report link has been copied to your clipboard.",
    });
  };

  const handleDownloadPdf = () => {
    downloadPdfMutation.mutate(undefined);
  };

  const canDownloadPdf = isAuthenticated && planData?.features?.pdf === true;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Card className="p-8 mb-6 print:border-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-report-domain">
              {domain}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              Deliverability Report • Generated {scanDate}
            </p>
            <StatusBadge status={overallStatus} />
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="icon" onClick={handleShare} data-testid="button-share-report">
              <Share2 className="h-4 w-4" />
            </Button>
            {canDownloadPdf && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDownloadPdf}
                disabled={downloadPdfMutation.isPending}
                data-testid="button-download-pdf"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handlePrint} data-testid="button-print-report">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Records</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Passed</p>
            <p className="text-2xl font-bold text-success">
              {records.filter((r) => r.status === "PASS").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Issues</p>
            <p className="text-2xl font-bold text-destructive">
              {records.filter((r) => r.status === "FAIL").length}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">DNS Records Analysis</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {records.map((record, index) => (
            <DNSRecordCard key={index} {...record} />
          ))}
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground print:hidden">
        <p>Powered by Inbox Deliverability Copilot</p>
      </div>
    </div>
  );
}
