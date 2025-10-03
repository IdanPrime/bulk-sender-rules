import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Zap, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LandingHero() {
  const [domain, setDomain] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest("POST", "/api/scan", { domain });
      return await res.json();
    },
    onSuccess: (data: any) => {
      sessionStorage.setItem("scanResult", JSON.stringify(data));
      setLocation("/scan");
    },
    onError: () => {
      toast({
        title: "Scan failed",
        description: "Failed to scan domain. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (domain) {
      scanMutation.mutate(domain);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-bold mb-6" data-testid="text-hero-title">
            Pass Gmail & Yahoo Bulk Sender Rules
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Scan your domain's DNS records for SPF, DKIM, DMARC, and BIMI. Get instant deliverability reports and actionable fixes.
          </p>

          <div className="flex gap-3 max-w-2xl mx-auto mb-4">
            <Input
              type="text"
              placeholder="Enter your domain (e.g., example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1"
              data-testid="input-domain"
              disabled={scanMutation.isPending}
            />
            <Button
              onClick={handleScan}
              size="default"
              className="px-8"
              data-testid="button-scan"
              disabled={scanMutation.isPending || !domain}
            >
              <Search className="h-4 w-4 mr-2" />
              {scanMutation.isPending ? "Scanning..." : "Scan Now"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Free instant scan • No signup required • Get shareable reports
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">DNS Security Scan</h3>
            <p className="text-muted-foreground">
              Comprehensive SPF, DKIM, DMARC, BIMI, and MX record analysis
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-success/10 mb-4">
              <Zap className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Template Linting</h3>
            <p className="text-muted-foreground">
              Detect spam triggers, verify links, and optimize deliverability
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-warning/10 mb-4">
              <BarChart3 className="h-6 w-6 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Health Tracking</h3>
            <p className="text-muted-foreground">
              Monitor delivery rates, bounces, and spam complaints over time
            </p>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Enter Your Domain</h4>
                <p className="text-sm text-muted-foreground">
                  Type your domain name to start the DNS scan
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Get Instant Results</h4>
                <p className="text-sm text-muted-foreground">
                  View PASS/WARN/FAIL status for all DNS records
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Fix & Share</h4>
                <p className="text-sm text-muted-foreground">
                  Copy DNS records and share reports with your team
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
