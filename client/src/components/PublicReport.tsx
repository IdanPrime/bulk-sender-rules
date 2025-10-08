import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Download, Settings, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "./StatusBadge";
import DNSRecordCard from "./DNSRecordCard";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { sanitizeDomain } from "@/lib/sanitize";

interface PublicReportProps {
  slug: string;
  domain: string;
  domainId?: string;
  domainUserId?: string;
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
  domainId,
  domainUserId,
  scanDate,
  overallStatus,
  records,
}: PublicReportProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  // Check if current user owns this domain
  const isOwner = isAuthenticated && domainId && user?.id === domainUserId;
  const [showAlertPrefs, setShowAlertPrefs] = useState(false);

  const { data: planData } = useQuery<{ plan: string; features: Record<string, boolean> }>({
    queryKey: ["/api/billing/plan"],
    enabled: isAuthenticated,
  });

  const { data: alertPrefs, isLoading: alertPrefsLoading } = useQuery<{
    emailEnabled: string | boolean;
    slackEnabled: string | boolean;
    threshold: string;
    digest: string | boolean;
  }>({
    queryKey: ["/api/domains", domainId, "alert-prefs"],
    enabled: Boolean(isOwner && domainId),
  });

  // Helper to normalize preferences to string values for API
  const normalizePrefs = (prefs: any) => ({
    emailEnabled: String(prefs.emailEnabled === true || prefs.emailEnabled === "true" ? "true" : "false"),
    slackEnabled: String(prefs.slackEnabled === true || prefs.slackEnabled === "true" ? "true" : "false"),
    threshold: String(prefs.threshold || "warn"),
    digest: String(prefs.digest === true || prefs.digest === "true" ? "true" : "false"),
  });

  const updateAlertPrefsMutation = useMutation({
    mutationFn: async (prefs: any) => {
      const normalized = normalizePrefs(prefs);
      const res = await apiRequest("PUT", `/api/domains/${domainId}/alert-prefs`, normalized);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", domainId, "alert-prefs"] });
      toast({
        title: "Alert Preferences Saved",
        description: "Your notification settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update alert preferences.",
        variant: "destructive",
      });
    },
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
      a.download = `${sanitizeDomain(domain)}-deliverability-report.pdf`;
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
              {sanitizeDomain(domain)}
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
            <p className="text-2xl font-bold">{records?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Passed</p>
            <p className="text-2xl font-bold text-success">
              {records?.filter((r) => r?.status === "PASS")?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Issues</p>
            <p className="text-2xl font-bold text-destructive">
              {records?.filter((r) => r?.status === "FAIL")?.length || 0}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">DNS Records Analysis</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {records?.map((record, index) => (
            <DNSRecordCard key={index} {...record} />
          )) || (
            <p className="text-muted-foreground">No DNS records found</p>
          )}
        </div>
      </div>

      {isOwner && (
        <Card className="mt-8 print:hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Alert Preferences</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlertPrefs(!showAlertPrefs)}
                data-testid="button-toggle-alert-prefs"
              >
                {showAlertPrefs ? "Hide" : "Show"}
              </Button>
            </div>
            <CardDescription>
              Configure notifications for this domain (overrides global settings)
            </CardDescription>
          </CardHeader>
          
          {showAlertPrefs && (
            <CardContent className="space-y-6">
              {alertPrefsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-pulse text-muted-foreground">Loading preferences...</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-enabled" data-testid="label-email-enabled">Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts via email
                      </p>
                    </div>
                    <Switch
                      id="email-enabled"
                      checked={alertPrefs?.emailEnabled === "true" || alertPrefs?.emailEnabled === true}
                      onCheckedChange={(checked) =>
                        updateAlertPrefsMutation.mutate({
                          ...alertPrefs,
                          emailEnabled: checked ? "true" : "false",
                        })
                      }
                      data-testid="switch-email-enabled"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="slack-enabled" data-testid="label-slack-enabled">Slack Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts via Slack webhook
                      </p>
                    </div>
                    <Switch
                      id="slack-enabled"
                      checked={alertPrefs?.slackEnabled === "true" || alertPrefs?.slackEnabled === true}
                      onCheckedChange={(checked) =>
                        updateAlertPrefsMutation.mutate({
                          ...alertPrefs,
                          slackEnabled: checked ? "true" : "false",
                        })
                      }
                      data-testid="switch-slack-enabled"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold" data-testid="label-threshold">Alert Threshold</Label>
                    <Select
                      value={alertPrefs?.threshold || "warn"}
                      onValueChange={(value) =>
                        updateAlertPrefsMutation.mutate({
                          ...alertPrefs,
                          threshold: value,
                        })
                      }
                    >
                      <SelectTrigger id="threshold" data-testid="select-threshold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info (all changes)</SelectItem>
                        <SelectItem value="warn">Warning (warnings & failures)</SelectItem>
                        <SelectItem value="fail">Critical (failures only)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Minimum severity level to trigger alerts
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="digest-enabled" data-testid="label-digest-enabled">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Include in weekly summary email
                      </p>
                    </div>
                    <Switch
                      id="digest-enabled"
                      checked={alertPrefs?.digest === "true" || alertPrefs?.digest === true}
                      onCheckedChange={(checked) =>
                        updateAlertPrefsMutation.mutate({
                          ...alertPrefs,
                          digest: checked ? "true" : "false",
                        })
                      }
                      data-testid="switch-digest-enabled"
                    />
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <div className="mt-12 text-center text-sm text-muted-foreground print:hidden">
        <p>Powered by Inbox Deliverability Copilot</p>
      </div>
    </div>
  );
}
