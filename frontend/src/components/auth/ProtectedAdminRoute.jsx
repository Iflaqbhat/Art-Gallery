import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import AccessDenied from "@/pages/AccessDenied";

const ProtectedAdminRoute = ({ children }) => {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
            — Verifying access
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/secret-login-panel-2024"
        state={{ from: location }}
        replace
      />
    );
  }

  if (!isAdmin()) {
    return <AccessDenied />;
  }

  return children;
};

export default ProtectedAdminRoute;
