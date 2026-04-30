import { useEffect } from "react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook to handle auth state changes and their impact on data caching
 * Prevents admin authentication from affecting public content display
 */
export const useAuthStateManager = () => {
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // When auth state changes, we need to be careful about cache invalidation
    if (!isLoading) {
      console.log("🔄 Auth state changed:", user ? "logged in" : "logged out");

      // If user just logged out from admin, we should preserve public data cache
      // but clear any admin-specific cache
      if (!user) {
        console.log(
          "🧹 User logged out - cleaning admin cache but preserving public data"
        );

        // Clear only admin-related queries, preserve public collections and artworks
        queryClient.removeQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey.some(
              (key) =>
                typeof key === "string" &&
                (key.includes("admin") ||
                  key.includes("user-") ||
                  key.includes("private"))
            );
          },
        });

        // Force refresh of public data after a short delay to ensure clean state
        setTimeout(() => {
          console.log("🔄 Refreshing public data after auth change");
          queryClient.invalidateQueries({
            queryKey: ["collections"],
          });
          queryClient.invalidateQueries({
            queryKey: ["artworks"],
          });
        }, 100);
      }
    }
  }, [user, isLoading, queryClient]);

  // Handle navigation events that might affect cache
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up any pending operations before navigation
      console.log("🔄 Navigation detected - cleaning up");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return {
    isAuthReady: !isLoading,
    user,
  };
};
