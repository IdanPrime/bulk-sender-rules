import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/template-lint", label: "Template Lint" },
  ];

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1" data-testid="link-home">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Deliverability Copilot</span>
          </a>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.path ? "text-foreground" : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                {item.label}
              </a>
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
