import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle, Crown } from "lucide-react";
import DomainCard from "./DomainCard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeDomain } from "@/lib/sanitize";
import UsageWidget from "./UsageWidget";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      toast({
        title: "Welcome to Pro!",
        description: "Your account has been upgraded successfully.",
      });
      window.history.replaceState({}, "", "/dashboard");
      queryClient.invalidateQueries({ queryKey: ["/api/billing/plan"] });
    }
  }, [toast]);

  const { data: dashboardData, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
  });

  const { data: planData } = useQuery<{ plan: string }>({
    queryKey: ["/api/billing/plan"],
    enabled: isAuthenticated,
    staleTime: 5000,
    retry: 1,
  });

  const addDomainMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/domain", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/usage"] });
      setShowAddDialog(false);
      setNewDomain("");
      toast({
        title: "Domain added",
        description: "You can now scan this domain",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add domain",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      addDomainMutation.mutate(newDomain.trim());
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your dashboard</p>
          <Button onClick={() => setLocation("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Usage widget skeleton */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-2 w-full max-w-md" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-24 w-full mb-8" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const domains = dashboardData?.domains || [];
  const isPro = user?.isPro === "true" || planData?.plan === "pro";

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <UsageWidget />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Domains</h1>
          <p className="text-muted-foreground">
            Manage and monitor your domain deliverability
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-domain">
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <Card className="mb-8" data-testid="card-subscription-status">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            {isPro ? (
              <>
                <Crown className="h-6 w-6 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Pro Plan</h3>
                    <Badge variant="default" data-testid="badge-pro">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlimited scans, email alerts, and team sharing
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Free Plan</h3>
                    <Badge variant="secondary" data-testid="badge-free">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    1 scan per day, basic reports
                  </p>
                </div>
              </>
            )}
          </div>
          {!isPro && (
            <Button onClick={() => setLocation("/pricing")} data-testid="button-upgrade-dashboard">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {domains.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No domains yet</p>
          <Button onClick={() => setShowAddDialog(true)}>Add your first domain</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain: any) => (
            <DomainCard
              key={domain.id}
              domain={sanitizeDomain(domain?.name)}
              lastScanDate={domain.latestReport ? formatDistanceToNow(new Date(domain.latestReport.createdAt), { addSuffix: true }) : "Never"}
              status={domain.latestReport?.scanJson?.summary?.overall || "WARN"}
              criticalIssues={domain.latestReport?.scanJson?.summary?.criticalIssues || 0}
              onRescan={() => setLocation(`/?domain=${sanitizeDomain(domain?.name)}&scan=true`)}
              onViewDetails={() => {
                if (domain.latestReport) {
                  setLocation(`/report/${domain.latestReport.slug}`);
                } else {
                  // No report yet, navigate to scan page
                  setLocation(`/?domain=${sanitizeDomain(domain?.name)}&scan=true`);
                }
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Domain</DialogTitle>
            <DialogDescription>Enter the domain name you want to monitor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                data-testid="input-add-domain"
              />
            </div>
            <Button 
              onClick={handleAddDomain} 
              className="w-full"
              disabled={addDomainMutation.isPending || !newDomain.trim()}
              data-testid="button-confirm-add-domain"
            >
              {addDomainMutation.isPending ? "Adding..." : "Add Domain"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
