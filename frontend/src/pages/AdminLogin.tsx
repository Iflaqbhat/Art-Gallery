import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import Logo from "@/components/ui/logo";

const DEMO_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ||
  "admin@amanarts.com";
const DEMO_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ||
  "amantheadmin";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  type AuthShape = {
    adminLogin: (email: string, password: string) => Promise<boolean>;
    demoAdminLogin: () => Promise<boolean>;
    isAuthenticated: boolean;
    isAdmin: () => boolean;
    isLoading: boolean;
    resetLoadingState: () => void;
  };
  const {
    adminLogin,
    demoAdminLogin,
    isAuthenticated,
    isAdmin,
    isLoading,
    resetLoadingState,
  } = useAuth() as AuthShape;

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

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const ok = await demoAdminLogin();
      if (ok) {
        toast({
          title: "Welcome, curator",
          description: "You're signed in as the demo admin.",
        });
        setTimeout(() => navigate("/admin", { replace: true }), 100);
      } else {
        throw new Error("Demo login failed.");
      }
    } catch (err) {
      toast({
        title: "Could not sign in",
        description:
          (err as Error)?.message ||
          "The demo admin account may not exist yet — sign up with the email above first.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  const copy = async (value: string, which: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard refused — non-fatal */
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

        {/* Demo / portfolio callout — prominent so recruiters and visitors
            never have to guess how to get into the admin panel. */}
        <div className="relative border border-champagne/40 bg-gradient-to-br from-champagne/[0.07] via-card to-card p-6 sm:p-7 mb-6 shadow-frame">
          <div className="flex items-start gap-4 mb-5">
            <div className="h-9 w-9 border border-champagne/50 bg-champagne/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-champagne" />
            </div>
            <div>
              <p className="gallery-eyebrow mb-1.5">— Visiting from a resume?</p>
              <h2 className="font-display text-xl text-ivory leading-snug">
                Try the curator panel — no signup required.
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm font-light leading-relaxed mt-2">
                One click logs you into the admin with full read &amp; write access
                to the demo gallery — collections, artworks, banner, audio,
                inquiries, the lot.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || isLoading}
            className="btn-gallery w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {demoLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Opening the panel…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Sign in as demo curator
              </>
            )}
          </button>

          <div className="space-y-2 font-mono text-[10px] tracking-[0.18em] uppercase">
            <div className="flex items-center justify-between gap-3 border border-border bg-background/60 px-3 py-2.5">
              <span className="text-muted-foreground shrink-0">Email</span>
              <span className="text-ivory truncate">{DEMO_EMAIL}</span>
              <button
                type="button"
                onClick={() => copy(DEMO_EMAIL, "email")}
                className="text-muted-foreground hover:text-champagne shrink-0"
                aria-label="Copy email"
              >
                {copied === "email" ? (
                  <Check className="h-3 w-3 text-champagne" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 border border-border bg-background/60 px-3 py-2.5">
              <span className="text-muted-foreground shrink-0">Password</span>
              <span className="text-ivory truncate">{DEMO_PASSWORD}</span>
              <button
                type="button"
                onClick={() => copy(DEMO_PASSWORD, "password")}
                className="text-muted-foreground hover:text-champagne shrink-0"
                aria-label="Copy password"
              >
                {copied === "password" ? (
                  <Check className="h-3 w-3 text-champagne" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-8 sm:p-10 shadow-frame">
          <p className="gallery-eyebrow mb-5 text-center">
            — Or sign in with your own credentials
          </p>
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
                placeholder="curator@maisonaman.art"
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                }}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 hover:text-champagne transition-colors"
              >
                <KeyRound className="inline h-3 w-3 mr-1" />
                Fill demo credentials
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || demoLoading}
              className="btn-gallery-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authorizing…
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign in
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
