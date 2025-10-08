import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, User, LogOut, Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NavBar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { path: "/template-lint", label: "Template Lint", show: true },
    { path: "/dashboard", label: "Dashboard", show: isAuthenticated },
  ].filter(item => item.show);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1" data-testid="link-home">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Deliverability Copilot</span>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === item.path ? "text-foreground" : "text-muted-foreground"
              }`}
              data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" data-testid="link-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-nav-login">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" data-testid="button-nav-signup">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
