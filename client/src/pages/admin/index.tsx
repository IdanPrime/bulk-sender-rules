import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  Users,
  Globe,
  Activity,
  Bell,
  MailWarning,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AdminMetrics {
  users: {
    byPlan: Record<string, number>;
    total: number;
  };
  domains: {
    total: number;
    monitored: number;
  };
  scans: {
    last24h: number;
    last7d: number;
  };
  alerts: {
    last24h: number;
  };
  email: {
    failuresLast24h: number;
  };
}

interface EventMetrics {
  total: number;
  byType: Record<string, number>;
  timeline: Array<{
    date: string;
    [key: string]: any;
  }>;
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: planData, isLoading: planLoading } = useQuery<{ plan: string }>({
    queryKey: ["/api/billing/plan"],
    enabled: isAuthenticated,
  });

  // For launch: use Agency plan as admin access proxy
  // TODO: In production, add isAdmin field to user schema
  const isAdmin = planData?.plan === "Agency";

  const { data: metrics, isLoading: metricsLoading, error } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
    enabled: isAuthenticated && isAdmin,
    retry: 1,
  });

  const { data: events, isLoading: eventsLoading } = useQuery<EventMetrics>({
    queryKey: ["/api/admin/metrics/events"],
    enabled: isAuthenticated && isAdmin,
    retry: 1,
  });

  // Reset metrics query when admin status changes to clear stale errors
  useEffect(() => {
    if (isAdmin) {
      queryClient.resetQueries({ queryKey: ["/api/admin/metrics"] });
      queryClient.resetQueries({ queryKey: ["/api/admin/metrics/events"] });
    }
  }, [isAdmin]);

  if (authLoading || planLoading) {
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
          <p className="text-muted-foreground mb-6">Please sign in to access the admin dashboard</p>
          <Button onClick={() => setLocation("/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (isAuthenticated && planData && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard
          </p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (metricsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform-wide metrics and statistics</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Metrics</h2>
          <p className="text-muted-foreground mb-6">
            Unable to fetch admin metrics. Please try again later.
          </p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const activePlanRatio =
    metrics.domains.total > 0
      ? Math.round((metrics.domains.monitored / metrics.domains.total) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Platform-wide metrics and statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.users.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-domains">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.domains.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.domains.monitored} actively monitored ({activePlanRatio}%)
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-scans-24h">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scans (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.scans.last24h}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.scans.last7d} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-alerts-24h">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts (24h)</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.alerts.last24h}</div>
            <p className="text-xs text-muted-foreground mt-1">Notifications sent</p>
          </CardContent>
        </Card>

        <Card data-testid="card-email-failures">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Failures</CardTitle>
            <MailWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.email.failuresLast24h}</div>
            <p className="text-xs text-muted-foreground mt-1">Failed deliveries (24h)</p>
          </CardContent>
        </Card>

        <Card data-testid="card-monitoring-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlanRatio}%</div>
            <p className="text-xs text-muted-foreground mt-1">Domains with monitoring enabled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Plan</CardTitle>
            <CardDescription>Distribution of users across subscription tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.users.byPlan)
                .sort((a, b) => b[1] - a[1])
                .map(([plan, count]) => (
                  <div
                    key={plan}
                    className="flex items-center justify-between"
                    data-testid={`row-plan-${plan.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          plan === "Agency" ? "default" : plan === "Pro" ? "secondary" : "outline"
                        }
                      >
                        {plan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {Math.round((count / metrics.users.total) * 100)}%
                      </span>
                      <span className="text-lg font-semibold">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>Recent platform activity highlights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average scans per day</span>
                <span className="text-lg font-semibold">
                  {Math.round(metrics.scans.last7d / 7)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alerts per scan (24h)</span>
                <span className="text-lg font-semibold">
                  {metrics.scans.last24h > 0
                    ? (metrics.alerts.last24h / metrics.scans.last24h).toFixed(2)
                    : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email delivery rate</span>
                <span className="text-lg font-semibold">
                  {metrics.alerts.last24h > 0
                    ? (
                        ((metrics.alerts.last24h - metrics.email.failuresLast24h) /
                          metrics.alerts.last24h) *
                        100
                      ).toFixed(1)
                    : "100"}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Domains per user</span>
                <span className="text-lg font-semibold">
                  {metrics.users.total > 0
                    ? (metrics.domains.total / metrics.users.total).toFixed(1)
                    : "0"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Product Analytics</h2>
        
        {eventsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!eventsLoading && !events && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Failed to load events data</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!eventsLoading && events && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Event Activity (Last 30 Days)</CardTitle>
                  <CardDescription>Total tracked events: {events.total}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(events.byType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([eventType, count]) => (
                        <div
                          key={eventType}
                          className="flex items-center justify-between"
                          data-testid={`row-event-${eventType.toLowerCase()}`}
                        >
                          <span className="text-sm font-medium">{eventType.replace(/_/g, ' ')}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    {Object.keys(events.byType).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No events tracked yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Distribution</CardTitle>
                  <CardDescription>Breakdown by event type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.total === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No events to display
                      </p>
                    ) : (
                      Object.entries(events.byType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([eventType, count]) => {
                          const percentage = events.total > 0 
                            ? Math.round((count / events.total) * 100) 
                            : 0;
                          return (
                            <div key={eventType} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{eventType.replace(/_/g, ' ')}</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline Chart */}
            {events.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Events Timeline</CardTitle>
                  <CardDescription>Daily event activity over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={events.timeline}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      />
                      <Legend />
                      {Object.keys(events.byType).map((eventType, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        return (
                          <Line
                            key={eventType}
                            type="monotone"
                            dataKey={eventType}
                            name={eventType.replace(/_/g, ' ')}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
