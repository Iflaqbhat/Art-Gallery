import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

export const useAdminAccess = () => {
  const { user, isAdmin, isCEO } = useAuth();
  const { toast } = useToast();

  const checkAdminAccess = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this feature.",
        variant: "destructive",
      });
      return false;
    }

    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "This feature requires CEO privileges.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const requireAdminAccess = () => {
    if (!checkAdminAccess()) {
      throw new Error("CEO access required");
    }
  };

  return {
    hasAdminAccess: isAdmin(),
    isCEO: isCEO(),
    checkAdminAccess,
    requireAdminAccess,
    user,
  };
};
