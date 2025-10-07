import { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function SubscribeForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?upgraded=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe to Pro - $19/month"
        )}
      </Button>
    </form>
  );
}

export default function SubscribePage() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      apiRequest("GET", "/api/subscription-status", {})
        .then((res) => res.json())
        .then(() => {
          toast({
            title: "Welcome to Pro!",
            description: "Your subscription is now active.",
          });
          setLocation("/dashboard");
        })
        .catch((error) => {
          console.error("Failed to check subscription status:", error);
          setLocation("/dashboard");
        });
      return;
    }

    apiRequest("POST", "/api/get-or-create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "active") {
          toast({
            title: "Already Subscribed",
            description: "You're already a Pro member!",
          });
          setLocation("/dashboard");
          return;
        }
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          toast({
            title: "Error",
            description: "Failed to initialize payment",
            variant: "destructive",
          });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Subscription error:", error);
        toast({
          title: "Error",
          description: "Failed to create subscription",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [isAuthenticated, authLoading, setLocation, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-subscribe" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subscription Error</CardTitle>
            <CardDescription>Unable to initialize payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/pricing")} className="w-full">
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Subscribe to Pro</CardTitle>
          <CardDescription>
            Complete your payment to unlock unlimited scans and premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
