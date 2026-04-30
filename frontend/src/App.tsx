import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import { AuthProvider } from "./contexts/SupabaseAuthContext";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";

// Public pages
import Index from "./pages/Index";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import ArtworkDetail from "./pages/ArtworkDetail";
import Artists from "./pages/Artists";
import Spotlight from "./pages/Spotlight";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/AdminLogin";
import AuthCallback from "./pages/AuthCallback";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ArtworksAdmin from "./pages/admin/ArtworksAdminNetflix";
import ArtworkForm from "./pages/admin/ArtworkFormNetflix";
import ArtistsAdmin from "./pages/admin/ArtistsAdmin";
import ArtistForm from "./pages/admin/ArtistForm";
import CollectionsAdmin from "./pages/admin/CollectionsAdmin";
import CollectionRoom from "./pages/admin/CollectionRoom";
import CollectionForm from "./pages/admin/CollectionForm";
import InquiriesAdmin from "./pages/admin/InquiriesAdmin";

// Cross-tab + auth state hooks
import { useQuerySync } from "./hooks/use-cross-tab-sync";
import { useAuthStateManager } from "./hooks/use-auth-state-manager";

// QueryClient with sane defaults + retry-on-network policy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: (failureCount, error) => {
        const errorMessage = (error as { message?: string })?.message || "";
        if (
          errorMessage.includes("400") ||
          errorMessage.includes("401") ||
          errorMessage.includes("403") ||
          errorMessage.includes("404")
        ) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    },
    mutations: {
      retry: 1,
    },
  },
});

const QuerySyncHandler = () => {
  const { subscribeToInvalidations } = useQuerySync();
  const { isAuthReady } = useAuthStateManager();

  useEffect(() => {
    const unsubscribe = subscribeToInvalidations(({ queryKey, type }) => {
      try {
        if (type === "invalidate") {
          queryClient.invalidateQueries({ queryKey });
        } else if (type === "refetch") {
          queryClient.refetchQueries({ queryKey });
        } else if (type === "reset") {
          queryClient.resetQueries({ queryKey });
        }
      } catch (error) {
        console.warn("Failed to handle query sync:", error);
      }
    });
    return unsubscribe;
  }, [subscribeToInvalidations]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthReady) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            if (query.state.fetchStatus === "fetching") return false;
            const lastFetched = query.state.dataUpdatedAt;
            if (!lastFetched) return false;
            const now = Date.now();
            const staleTime = 2 * 60 * 1000;
            return now - lastFetched > staleTime;
          },
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthReady]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <QuerySyncHandler />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collection/:id" element={<CollectionDetail />} />
            <Route path="/artwork/:id" element={<ArtworkDetail />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/spotlight" element={<Spotlight />} />

            {/* Auth */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Legacy aliases */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Hidden curator entrance */}
            <Route
              path="/admin/secret-login-panel-2024"
              element={<AdminLogin />}
            />

            {/* Admin (curator) */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/artworks"
              element={
                <ProtectedAdminRoute>
                  <ArtworksAdmin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/artworks/new"
              element={
                <ProtectedAdminRoute>
                  <ArtworkForm />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/artworks/:id/edit"
              element={
                <ProtectedAdminRoute>
                  <ArtworkForm />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/artists"
              element={
                <ProtectedAdminRoute>
                  <ArtistsAdmin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/artists/new"
              element={
                <ProtectedAdminRoute>
                  <ArtistForm />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/artists/:id/edit"
              element={
                <ProtectedAdminRoute>
                  <ArtistForm />
                </ProtectedAdminRoute>
              }
            />

            {/* Collections admin */}
            <Route
              path="/admin/collections"
              element={
                <ProtectedAdminRoute>
                  <CollectionsAdmin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/collections/new"
              element={
                <ProtectedAdminRoute>
                  <CollectionForm />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/collections/:id"
              element={
                <ProtectedAdminRoute>
                  <CollectionRoom />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/collections/:id/edit"
              element={
                <ProtectedAdminRoute>
                  <CollectionForm />
                </ProtectedAdminRoute>
              }
            />

            {/* Inquiries admin */}
            <Route
              path="/admin/inquiries"
              element={
                <ProtectedAdminRoute>
                  <InquiriesAdmin />
                </ProtectedAdminRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
