import ScanResults from "@/components/ScanResults";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ScanPage() {
  const [scanData, setScanData] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const stored = sessionStorage.getItem("scanResult");
    if (stored) {
      setScanData(JSON.parse(stored));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const saveAndShareMutation = useMutation({
    mutationFn: async () => {
      if (!scanData.domain) {
        throw new Error("Domain information missing");
      }
      const res = await apiRequest("POST", "/api/scan", {
        domain: scanData.domain,
        save: true,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.reportSlug) {
        setLocation(`/report/${data.reportSlug}`);
        toast({
          title: "Scan saved!",
          description: "Your scan has been saved and is ready to share.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save scan",
        description: error.message || "Unable to save scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/report", {
        domainId: null,
        scanJson: scanData,
      });
      return await res.json();
    },
    onSuccess: (report: any) => {
      setLocation(`/report/${report.slug}`);
      toast({
        title: "Report generated",
        description: "Your report is ready to share!",
      });
    },
    onError: () => {
      toast({
        title: "Failed to generate report",
        description: "Unable to create shareable report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Scan results link copied to clipboard",
    });
  };

  if (!scanData) {
    return null;
  }

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
    <ScanResults
      domain={scanData.domain}
      overallStatus={scanData.summary.overall}
      criticalIssues={scanData.summary.criticalIssues}
      records={records}
      onGenerateReport={() => generateReportMutation.mutate()}
      onSaveAndShare={isAuthenticated ? () => saveAndShareMutation.mutate() : undefined}
      onShare={handleShare}
      isAuthenticated={isAuthenticated}
    />
  );
}
