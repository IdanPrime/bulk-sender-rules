import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Webhook, Trash2 } from "lucide-react";
import { SiSlack } from "react-icons/si";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Destination {
  id: string;
  userId: string;
  type: "slack" | "webhook";
  url: string;
  enabled: boolean;
  createdAt: string;
}

export default function DestinationsTab() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [destType, setDestType] = useState<"slack" | "webhook">("slack");
  const [destUrl, setDestUrl] = useState("");

  const { data: destinations, isLoading } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
  });

  const addDestinationMutation = useMutation({
    mutationFn: async (data: { type: string; url: string; enabled: boolean }) => {
      const res = await apiRequest("POST", "/api/destinations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      setShowAddDialog(false);
      setDestUrl("");
      toast({
        title: "Destination Added",
        description: "Your notification destination has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Destination",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleDestinationMutation = useMutation({
    mutationFn: async (data: { id: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/destinations/${data.id}`, {
        enabled: data.enabled,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({
        title: "Destination Updated",
        description: "Notification destination has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Destination",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/destinations/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/destinations"] });
      toast({
        title: "Destination Deleted",
        description: "Notification destination has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Destination",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddDestination = () => {
    if (!destUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a webhook URL.",
        variant: "destructive",
      });
      return;
    }

    addDestinationMutation.mutate({
      type: destType,
      url: destUrl.trim(),
      enabled: true,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading destinations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notification Destinations</CardTitle>
            <CardDescription>
              Configure where alerts are sent when issues are detected
            </CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-destination">
                <Plus className="h-4 w-4 mr-2" />
                Add Destination
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Notification Destination</DialogTitle>
                <DialogDescription>
                  Add a Slack or webhook destination for alert notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="dest-type">Destination Type</Label>
                  <Select value={destType} onValueChange={(v) => setDestType(v as "slack" | "webhook")}>
                    <SelectTrigger data-testid="select-dest-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slack">Slack Webhook</SelectItem>
                      <SelectItem value="webhook">Generic Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dest-url">Webhook URL</Label>
                  <Input
                    id="dest-url"
                    value={destUrl}
                    onChange={(e) => setDestUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    data-testid="input-dest-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {destType === "slack"
                      ? "Get your Slack webhook URL from your workspace settings"
                      : "Enter the URL where notifications should be sent"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  data-testid="button-cancel-add-dest"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDestination}
                  disabled={addDestinationMutation.isPending}
                  data-testid="button-confirm-add-dest"
                >
                  {addDestinationMutation.isPending ? "Adding..." : "Add Destination"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {destinations && destinations.length > 0 ? (
            destinations.map((dest) => (
              <Card key={dest.id} className="p-4" data-testid={`card-dest-${dest.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {dest.type === "slack" ? (
                      <SiSlack className="h-5 w-5 text-[#4A154B]" />
                    ) : (
                      <Webhook className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium capitalize">{dest.type}</p>
                        <Badge variant={dest.enabled ? "default" : "secondary"}>
                          {dest.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {dest.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleDestinationMutation.mutate({
                          id: dest.id,
                          enabled: !dest.enabled,
                        })
                      }
                      disabled={toggleDestinationMutation.isPending}
                      data-testid={`button-toggle-dest-${dest.id}`}
                    >
                      {dest.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDestinationMutation.mutate(dest.id)}
                      disabled={deleteDestinationMutation.isPending}
                      data-testid={`button-delete-dest-${dest.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No destinations configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add a destination to receive alert notifications
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
