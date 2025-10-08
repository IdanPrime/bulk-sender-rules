import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function Forbidden() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center p-8">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-2">403 - Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this resource. Please contact the owner or sign in with an authorized account.
          </p>
          <Link href="/dashboard">
            <Button data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
