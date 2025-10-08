import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import TeamsTab from "./teams-tab";
import DestinationsTab from "./destinations-tab";
import AlertPrefsTab from "./alert-prefs-tab";
import BillingTab from "./billing-tab";

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: planData } = useQuery<{ plan: string; features: Record<string, boolean> }>({
    queryKey: ["/api/billing/plan"],
    enabled: isAuthenticated,
  });

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
          <p className="text-muted-foreground mb-6">Please sign in to access settings</p>
          <Button onClick={() => setLocation("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  const hasTeamsFeature = planData?.features?.teams === true;
  const hasSlackFeature = planData?.features?.slack === true;
  const hasWebhookFeature = planData?.features?.webhook === true;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="alert-prefs" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="alert-prefs" data-testid="tab-alert-prefs">
            Alert Preferences
          </TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">
            Billing
          </TabsTrigger>
          {(hasSlackFeature || hasWebhookFeature) && (
            <TabsTrigger value="destinations" data-testid="tab-destinations">
              Destinations
            </TabsTrigger>
          )}
          {hasTeamsFeature && (
            <TabsTrigger value="teams" data-testid="tab-teams">
              Teams
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="alert-prefs">
          <AlertPrefsTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        {(hasSlackFeature || hasWebhookFeature) && (
          <TabsContent value="destinations">
            <DestinationsTab />
          </TabsContent>
        )}

        {hasTeamsFeature && (
          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
