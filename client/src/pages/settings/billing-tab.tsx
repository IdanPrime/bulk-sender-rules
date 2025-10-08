import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, CreditCard, Crown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function BillingTab() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: planData, isLoading: planLoading } = useQuery<{ 
    plan: string; 
    features: Record<string, boolean> 
  }>({
    queryKey: ["/api/billing/plan"],
  });

  const createPortalSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/portal/create-session");
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      window.open(data.url, "_blank");
      toast({
        title: "Opening Billing Portal",
        description: "You'll be redirected to manage your subscription.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Open Portal",
        description: error.message || "Unable to access billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (planLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = planData?.plan || "free";
  const isPaidUser = plan === "pro" || plan === "agency";

  // Free plan: show upgrade banner
  if (!isPaidUser) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-upgrade-banner">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Upgrade to Pro or Agency</CardTitle>
              <CardDescription className="text-base mt-1">
                Unlock advanced features like teams, unlimited domains, and priority support
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">Unlimited domain monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">Team collaboration & access control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">Slack & webhook notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">White-label PDF reports (Agency)</span>
              </div>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={() => setLocation("/pricing")}
              data-testid="button-view-pricing"
            >
              View Pricing & Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pro/Agency plan: show billing portal access
  return (
    <div className="space-y-6">
      <Card data-testid="card-current-plan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant={plan === "agency" ? "default" : "secondary"} className="ml-2">
                  {plan === "agency" ? "Agency" : "Pro"}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                You're subscribed to the {plan === "agency" ? "Agency" : "Pro"} plan
              </CardDescription>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your subscription, update payment methods, view invoices, and download receipts through the Stripe billing portal.
          </p>
          <Button
            onClick={() => createPortalSessionMutation.mutate()}
            disabled={createPortalSessionMutation.isPending}
            data-testid="button-manage-billing"
          >
            {createPortalSessionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                Manage Billing & Invoices
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="card-billing-info">
        <CardHeader>
          <CardTitle>What you can do in the billing portal</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <span>Update payment method and billing information</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <span>View payment history and download invoices</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <span>Manage subscription (upgrade, downgrade, or cancel)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
              <span>Update billing email and contact information</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
