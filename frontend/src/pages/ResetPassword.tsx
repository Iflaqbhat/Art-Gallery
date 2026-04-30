import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/ui/logo";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [searchParams] = useSearchParams();
  type AuthShape = {
    updatePassword: (password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    resetLoadingState: () => void;
  };
  const {
    updatePassword,
    isLoading,
    error,
    clearError,
    resetLoadingState,
  } = useAuth() as AuthShape;
  const navigate = useNavigate();
  const { toast } = useToast();

  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    resetLoadingState();
  }, [resetLoadingState]);

  useEffect(() => {
    if (!accessToken) {
      toast({
        title: "Invalid reset link",
        description: "This link is invalid or expired. Please request a new one.",
        variant: "destructive",
      });
      navigate("/auth/forgot-password", { replace: true });
    }
  }, [accessToken, navigate, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "password" | "confirm"
  ) => {
    if (field === "password") setPassword(e.target.value);
    else setConfirmPassword(e.target.value);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Re-enter both passwords.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updatePassword(password);
      setIsComplete(true);
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
    } catch (err) {
      console.error("Password update error:", err);
    }
  };

  const strength =
    password.length >= 12
      ? { label: "Strong", color: "text-champagne" }
      : password.length >= 8
      ? { label: "Good", color: "text-champagne/80" }
      : password.length >= 6
      ? { label: "Fair", color: "text-muted-foreground" }
      : { label: "Too short", color: "text-destructive" };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,165,116,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        {isComplete ? (
          <>
            <div className="text-center mb-10">
              <CheckCircle className="h-7 w-7 text-champagne mx-auto mb-5" />
              <p className="gallery-eyebrow mb-4">— Updated</p>
              <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
                Password set
              </h1>
              <p className="text-muted-foreground text-sm">
                Your new password is in place. Sign in to continue.
              </p>
            </div>
            <div className="border border-border bg-card p-8 sm:p-10 shadow-frame">
              <Link to="/auth/login" className="btn-gallery w-full">
                Sign in now
              </Link>
              <Link
                to="/"
                className="block mt-4 text-center font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-ivory transition-colors py-2"
              >
                ← Back to gallery
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-10">
              <p className="gallery-eyebrow mb-4">— New password</p>
              <h1 className="font-display text-4xl sm:text-5xl text-ivory mb-3 leading-tight">
                Reset password
              </h1>
              <p className="text-muted-foreground text-sm">
                Choose a new password to secure your account.
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
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handleChange(e, "password")}
                    autoComplete="new-password"
                    required
                    placeholder="At least 6 characters"
                    className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => handleChange(e, "confirm")}
                    autoComplete="new-password"
                    required
                    placeholder="Confirm new password"
                    className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/50 px-4 py-3 text-base focus:outline-none focus:border-champagne/60 transition-colors"
                  />
                </div>

                {password && (
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                    Strength · <span className={strength.color}>{strength.label}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="btn-gallery w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Set new password
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
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
