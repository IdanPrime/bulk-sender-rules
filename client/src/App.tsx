import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NavBar from "@/components/NavBar";
import Home from "@/pages/home";
import DashboardPage from "@/pages/dashboard";
import ScanPage from "@/pages/scan";
import TemplateLintPage from "@/pages/template-lint";
import ReportPage from "@/pages/report";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/scan" component={ScanPage} />
      <Route path="/template-lint" component={TemplateLintPage} />
      <Route path="/report/:slug" component={ReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
