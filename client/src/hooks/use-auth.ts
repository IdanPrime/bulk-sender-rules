import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  email: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  isPro?: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: User | null;
}

export function useAuth() {
  const { data: session, isLoading } = useQuery<AuthSession>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/session"], {
        authenticated: false,
        user: null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  return {
    user: session?.user || null,
    isAuthenticated: session?.authenticated || false,
    isLoading,
    logout: () => logoutMutation.mutate(),
  };
}
