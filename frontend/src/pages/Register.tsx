import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/logo";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);

  type AuthShape = {
    register: (creds: {
      name: string;
      email: string;
      password: string;
    }) => Promise<{ autoLoggedIn?: boolean; needsEmailConfirmation?: boolean }>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    resetLoadingState: () => void;
    isAuthenticated: boolean;
  };

  const {
    register,
    isLoading,
    error,
    clearError,
    resetLoadingState,
    isAuthenticated,
  } = useAuth() as AuthShape;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    resetLoadingState();
  }, [resetLoadingState]);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please re-enter both passwords.",
        variant: "destructive",
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      if (result?.autoLoggedIn) {
        navigate("/", { replace: true });
        return;
      }
      if (result?.needsEmailConfirmation) {
        toast({
          title: "Check your inbox",
          description: "Verify your email, then sign in.",
        });
        navigate("/auth/login", { replace: true });
        return;
      }
      navigate("/auth/login", { replace: true });
    } catch (err) {
      toast({
        title: "Registration failed",
        description: (err as Error)?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="text-center mb-8">
          <p className="gallery-eyebrow mb-4">— Become a member</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
            Join the maison
          </h1>
          <p className="text-muted-foreground text-sm">
            Already a member?{" "}
            <Link to="/auth/login" className="text-champagne hover:text-ivory transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <div className="border border-border bg-card p-8 sm:p-10 shadow-frame">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-ivory">
                {error}
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                Full name
              </label>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••"
                    className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 pr-10 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-champagne"
                    aria-label="Toggle password visibility"
                  >
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Confirm
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                />
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
                  Creating membership…
                </>
              ) : (
                "Create membership"
              )}
            </button>

            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 text-center">
              By joining you agree to be a thoughtful guest.
            </p>
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

export default Register;
