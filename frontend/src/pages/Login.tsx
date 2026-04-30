import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/logo";

type AuthShape = {
  login: (creds: { email: string; password: string }) => Promise<unknown>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  resetLoadingState: () => void;
  isAuthenticated: boolean;
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);

  const {
    login,
    isLoading,
    error,
    clearError,
    resetLoadingState,
    isAuthenticated,
  } = useAuth() as AuthShape;
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  useEffect(() => {
    resetLoadingState();
  }, [resetLoadingState]);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: formData.email, password: formData.password });
      toast({ title: "Welcome back", description: "Signed in successfully." });
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: "Sign-in failed",
        description: (err as Error)?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-16">
      {/* Decorative warm glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <p className="gallery-eyebrow mb-4">— Member entrance</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Or{" "}
            <Link to="/auth/register" className="text-champagne hover:text-ivory transition-colors">
              become a member
            </Link>
          </p>
        </div>

        {/* Form card */}
        <div className="border border-border bg-card p-8 sm:p-10 shadow-frame">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-ivory">
                {error}
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="font-mono text-[10px] tracking-[0.18em] uppercase text-champagne/80 hover:text-champagne transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 pr-12 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-champagne transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gallery w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
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
      </div>
    </div>
  );
};

export default Login;
