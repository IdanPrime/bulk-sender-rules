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
import { Plus, Users, Crown, Shield, Eye, Trash2, UserPlus } from "lucide-react";
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

interface Team {
  id: string;
  name: string;
  ownerUserId: string;
  brandLogo?: string | null;
  brandColor?: string | null;
  createdAt: string;
  role?: string;
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  email?: string;
  createdAt: string;
}

export default function TeamsTab() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "viewer">("viewer");

  const { data: teamsData, isLoading } = useQuery<{ owned: Team[]; member: Team[] }>({
    queryKey: ["/api/teams"],
  });

  const { data: membersData } = useQuery<TeamMember[]>({
    queryKey: ["/api/teams", selectedTeam?.id, "members"],
    enabled: !!selectedTeam,
    queryFn: () =>
      fetch(`/api/teams/${selectedTeam?.id}/members`).then((r) => r.json()),
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; brandLogo?: string; brandColor?: string }) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setShowCreateDialog(false);
      setNewTeamName("");
      setBrandLogo("");
      setBrandColor("");
      toast({
        title: "Team Created",
        description: "Your new team has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Team",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; email: string; role: string }) => {
      const res = await apiRequest("POST", `/api/teams/${data.teamId}/members`, {
        email: data.email,
        role: data.role,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam?.id, "members"] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("viewer");
      toast({
        title: "Member Invited",
        description: "Team member has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Invite Member",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (data: { teamId: string; userId: string }) => {
      const res = await apiRequest("DELETE", `/api/teams/${data.teamId}/members/${data.userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam?.id, "members"] });
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Member",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { teamId: string; brandLogo?: string; brandColor?: string }) => {
      const res = await apiRequest("PATCH", `/api/teams/${data.teamId}`, {
        brandLogo: data.brandLogo,
        brandColor: data.brandColor,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team Updated",
        description: "Team branding has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Team",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Team Name Required",
        description: "Please enter a team name.",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate({
      name: newTeamName.trim(),
      brandLogo: brandLogo || undefined,
      brandColor: brandColor || undefined,
    });
  };

  const handleInviteMember = () => {
    if (!selectedTeam || !inviteEmail.trim()) return;

    inviteMemberMutation.mutate({
      teamId: selectedTeam.id,
      email: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (!selectedTeam) return;

    removeMemberMutation.mutate({
      teamId: selectedTeam.id,
      userId,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Teams</CardTitle>
              <CardDescription>Manage your teams and collaboration</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-team">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Create a team to collaborate with others on domain monitoring
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Acme Corp Team"
                      data-testid="input-team-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand-logo">Brand Logo URL (optional)</Label>
                    <Input
                      id="brand-logo"
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      data-testid="input-brand-logo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand-color">Brand Color (optional)</Label>
                    <Input
                      id="brand-color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#0066FF"
                      data-testid="input-brand-color"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTeam}
                    disabled={createTeamMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamsData?.owned && teamsData.owned.length > 0 ? (
              <>
                <h3 className="text-sm font-medium">Teams You Own</h3>
                <div className="grid gap-4">
                  {teamsData.owned.map((team) => (
                    <Card key={team.id} className="p-4" data-testid={`card-team-${team.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium" data-testid={`text-team-name-${team.id}`}>
                              {team.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(team.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTeam(team)}
                            data-testid={`button-manage-team-${team.id}`}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}

            {teamsData?.member && teamsData.member.length > 0 ? (
              <>
                <h3 className="text-sm font-medium mt-6">Teams You're In</h3>
                <div className="grid gap-4">
                  {teamsData.member.map((team) => (
                    <Card key={team.id} className="p-4" data-testid={`card-member-team-${team.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(team.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(team.role || "viewer")}>
                          {getRoleIcon(team.role || "viewer")}
                          <span className="ml-1 capitalize">{team.role}</span>
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}

            {(!teamsData?.owned || teamsData.owned.length === 0) &&
              (!teamsData?.member || teamsData.member.length === 0) && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No teams yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a team to collaborate with others
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage {selectedTeam.name}</DialogTitle>
              <DialogDescription>Manage team members and branding</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Team Members</h3>
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-invite-member">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>Add a new member to your team</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@example.com"
                            data-testid="input-invite-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role</Label>
                          <Select
                            value={inviteRole}
                            onValueChange={(value) => setInviteRole(value as "admin" | "viewer")}
                          >
                            <SelectTrigger data-testid="select-invite-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin - Can manage team and members</SelectItem>
                              <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowInviteDialog(false)}
                          data-testid="button-cancel-invite"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleInviteMember}
                          disabled={inviteMemberMutation.isPending}
                          data-testid="button-confirm-invite"
                        >
                          {inviteMemberMutation.isPending ? "Inviting..." : "Invite"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {membersData?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted"
                      data-testid={`row-member-${member.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1 capitalize">{member.role}</span>
                        </Badge>
                        {member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removeMemberMutation.isPending}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">Team Branding</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-brand-logo">Brand Logo URL</Label>
                    <Input
                      id="edit-brand-logo"
                      value={selectedTeam.brandLogo || ""}
                      onChange={(e) =>
                        setSelectedTeam({ ...selectedTeam, brandLogo: e.target.value })
                      }
                      placeholder="https://example.com/logo.png"
                      data-testid="input-edit-brand-logo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-brand-color">Brand Color</Label>
                    <Input
                      id="edit-brand-color"
                      value={selectedTeam.brandColor || ""}
                      onChange={(e) =>
                        setSelectedTeam({ ...selectedTeam, brandColor: e.target.value })
                      }
                      placeholder="#0066FF"
                      data-testid="input-edit-brand-color"
                    />
                  </div>
                  <Button
                    onClick={() =>
                      updateTeamMutation.mutate({
                        teamId: selectedTeam.id,
                        brandLogo: selectedTeam.brandLogo || undefined,
                        brandColor: selectedTeam.brandColor || undefined,
                      })
                    }
                    disabled={updateTeamMutation.isPending}
                    data-testid="button-update-branding"
                  >
                    {updateTeamMutation.isPending ? "Updating..." : "Update Branding"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
