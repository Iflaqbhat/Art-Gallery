import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import Logo from "@/components/ui/logo";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  type AuthShape = {
    adminLogin: (email: string, password: string) => Promise<boolean>;
    isAuthenticated: boolean;
    isAdmin: () => boolean;
    isLoading: boolean;
    resetLoadingState: () => void;
  };
  const { adminLogin, isAuthenticated, isAdmin, isLoading, resetLoadingState } =
    useAuth() as AuthShape;

  useEffect(() => {
    resetLoadingState();
  }, [resetLoadingState]);

  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Enter both curator email and password.",
        variant: "destructive",
      });
      return;
    }
    try {
      const ok = await adminLogin(email, password);
      if (ok) {
        setTimeout(() => {
          if (!isAuthenticated || !isAdmin()) {
            navigate("/admin", { replace: true });
          }
        }, 100);
      } else {
        throw new Error("Authentication failed.");
      }
    } catch (err) {
      toast({
        title: "Access denied",
        description:
          (err as Error)?.message || "Check the credentials and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(198,107,61,0.06),transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Logo variant="admin" />
          </Link>
        </div>

        <div className="text-center mb-10">
          <Shield className="h-7 w-7 text-champagne mx-auto mb-5" />
          <p className="gallery-eyebrow mb-4">— Curator entrance</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
            Authorized only
          </h1>
          <p className="text-muted-foreground text-sm font-light">
            This door leads to the back-of-house.
          </p>
        </div>

        <div className="border border-border bg-card p-8 sm:p-10 shadow-frame">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                Curator email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="curator@canvaso.art"
                className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 pr-12 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-champagne"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quiet quick-fill — only useful in development. Hidden text style
                on purpose so it doesn't compete with the form. */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail(
                    (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ||
                      "admin@amanarts.com"
                  );
                  setPassword(
                    (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ||
                      "amantheadmin"
                  );
                }}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 hover:text-champagne transition-colors"
              >
                <KeyRound className="inline h-3 w-3 mr-1" />
                Use default credentials
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gallery w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authorizing…
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Enter curator panel
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <Link
              to="/"
              className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-ivory transition-colors"
            >
              ← Back to gallery
            </Link>
          </div>
        </div>

        <p className="text-center font-mono text-[9px] tracking-[0.32em] uppercase text-muted-foreground/60 mt-8">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
