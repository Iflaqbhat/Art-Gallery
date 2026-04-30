import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * OAuth / magic-link return URL. With flowType PKCE + detectSessionInUrl,
 * the Supabase client exchanges ?code= in GoTrueClient._initialize() on first
 * load — do NOT call exchangeCodeForSession here, otherwise the authorization
 * code runs twice and sign-in fails.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      const url = new URL(window.location.href);
      const oauthError = url.searchParams.get("error");
      const oauthDescription = url.searchParams.get("error_description");
      if (oauthError) {
        const msg = oauthDescription
          ? decodeURIComponent(oauthDescription.replace(/\+/g, " "))
          : oauthError;
        toast({
          title: "Sign-in canceled",
          description: msg,
          variant: "destructive",
        });
        navigate("/auth/login", { replace: true });
        return;
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        console.error("Auth callback getSession:", error);
        toast({
          title: "Authentication error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/auth/login", { replace: true });
        return;
      }

      if (session?.user) {
        try {
          if (window.history.replaceState) {
            window.history.replaceState(
              {},
              document.title,
              `${window.location.origin}${window.location.pathname}`
            );
          }
        } catch {
          /* noop */
        }

        toast({
          title: "Welcome",
          description: "Signed in successfully.",
        });
        navigate("/", { replace: true });
      } else {
        navigate("/auth/login", { replace: true });
      }
    };

    finish();
    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Loader2 className="h-6 w-6 text-champagne mx-auto mb-6 animate-spin" />
        <p className="gallery-eyebrow mb-3">— One moment</p>
        <h2 className="font-display text-3xl text-ivory mb-2">
          Completing sign in
        </h2>
        <p className="text-muted-foreground text-sm font-light">
          Just a beat — we're verifying your invitation.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
