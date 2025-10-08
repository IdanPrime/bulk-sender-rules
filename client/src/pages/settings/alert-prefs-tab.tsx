import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertPref {
  userId: string;
  emailEnabled: boolean;
  slackEnabled: boolean;
  webhookEnabled: boolean;
  threshold: "info" | "warn" | "fail";
}

export default function AlertPrefsTab() {
  const { toast } = useToast();

  const { data: alertPrefs, isLoading } = useQuery<AlertPref>({
    queryKey: ["/api/alert-prefs"],
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (data: Partial<AlertPref>) => {
      const res = await apiRequest("POST", "/api/alert-prefs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-prefs"] });
      toast({
        title: "Preferences Updated",
        description: "Your alert preferences have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Preferences",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (field: keyof AlertPref, value: boolean) => {
    updatePrefsMutation.mutate({ [field]: value });
  };

  const handleThresholdChange = (value: string) => {
    updatePrefsMutation.mutate({ threshold: value as "info" | "warn" | "fail" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  const prefs = alertPrefs || {
    emailEnabled: false,
    slackEnabled: false,
    webhookEnabled: false,
    threshold: "warn" as const,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Alert Preferences</CardTitle>
        <CardDescription>
          Configure how you want to receive notifications about domain issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts via email
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={prefs.emailEnabled}
                onCheckedChange={(checked) => handleToggle("emailEnabled", checked)}
                disabled={updatePrefsMutation.isPending}
                data-testid="switch-email-enabled"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="slack-enabled">Slack Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts to configured Slack channels
                </p>
              </div>
              <Switch
                id="slack-enabled"
                checked={prefs.slackEnabled}
                onCheckedChange={(checked) => handleToggle("slackEnabled", checked)}
                disabled={updatePrefsMutation.isPending}
                data-testid="switch-slack-enabled"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="webhook-enabled">Webhook Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts to configured webhook endpoints
                </p>
              </div>
              <Switch
                id="webhook-enabled"
                checked={prefs.webhookEnabled}
                onCheckedChange={(checked) => handleToggle("webhookEnabled", checked)}
                disabled={updatePrefsMutation.isPending}
                data-testid="switch-webhook-enabled"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Alert Threshold</h3>
          <div className="space-y-2">
            <Label htmlFor="threshold">Minimum Severity Level</Label>
            <Select
              value={prefs.threshold}
              onValueChange={handleThresholdChange}
              disabled={updatePrefsMutation.isPending}
            >
              <SelectTrigger id="threshold" data-testid="select-threshold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info - All notifications</SelectItem>
                <SelectItem value="warn">Warning - Only warnings and failures</SelectItem>
                <SelectItem value="fail">Failure - Only critical failures</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              You'll only receive alerts that meet or exceed this severity level
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Per-Domain Overrides</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can override these global settings for individual domains from the domain
                detail page. Domain-specific settings will take precedence over these global
                preferences.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
