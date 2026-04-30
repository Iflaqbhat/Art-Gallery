import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/logo";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  type AuthShape = {
    resetPassword: (email: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    resetLoadingState: () => void;
    isAuthenticated: boolean;
  };
  const {
    resetPassword,
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
    setEmail(e.target.value);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Password reset error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        {isSubmitted ? (
          <>
            <div className="text-center mb-10">
              <CheckCircle className="h-7 w-7 text-champagne mx-auto mb-5" />
              <p className="gallery-eyebrow mb-4">— Sent</p>
              <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
                Check your inbox
              </h1>
              <p className="text-muted-foreground text-sm">
                We sent a reset link to{" "}
                <span className="text-ivory font-medium">{email}</span>
              </p>
            </div>

            <div className="border border-border bg-card p-8 sm:p-10 shadow-frame">
              <div className="border border-champagne/20 bg-secondary/40 p-5 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-champagne mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-champagne">
                      Open your email
                    </p>
                    <p className="text-muted-foreground text-sm font-light">
                      Click the link in our message. The link expires in 1 hour.
                    </p>
                  </div>
                </div>
              </div>

              <Link to="/auth/login" className="btn-gallery w-full">
                Back to sign in
              </Link>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="w-full mt-3 font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-ivory transition-colors py-2"
              >
                Try a different email
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-10">
              <p className="gallery-eyebrow mb-4">— Recovery</p>
              <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
                Forgot your password?
              </h1>
              <p className="text-muted-foreground text-sm">
                We'll email instructions to reset it.
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
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="btn-gallery w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send reset link
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-border text-center space-y-3">
                <Link
                  to="/auth/login"
                  className="block font-mono text-[10px] tracking-[0.32em] uppercase text-champagne hover:text-ivory transition-colors"
                >
                  Remembered? Sign in
                </Link>
                <Link
                  to="/"
                  className="block font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-ivory transition-colors"
                >
                  ← Back to gallery
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
