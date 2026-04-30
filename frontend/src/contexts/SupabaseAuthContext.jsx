import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, supabase } from "../lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    // Background fetch of the public.users profile for role lookup. Runs
    // *after* we've already cleared isLoading so a slow/stuck profile query
    // never gates the UI behind a "verifying access" loader.
    const hydrateProfile = async (authUser, event) => {
      if (!authUser) return;
      try {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.warn("Could not fetch user profile:", profileError);
        }

        if (cancelled) return;

        if (!profile && event === "SIGNED_IN") {
          // First time we've seen this auth user — back-fill their public
          // profile row. RLS allows self-insert (auth.uid() = id).
          const { data: created, error: createError } = await supabase
            .from("users")
            .upsert({
              id: authUser.id,
              name:
                authUser.user_metadata?.name ||
                authUser.email?.split("@")[0] ||
                "User",
              email: authUser.email,
              role: "user",
            })
            .select()
            .maybeSingle();

          if (createError) {
            console.warn("Could not create user profile:", createError);
            if (!cancelled) setUser(authUser);
          } else if (!cancelled) {
            setUser(created || authUser);
          }
        } else if (!cancelled) {
          setUser(profile || authUser);
        }
      } catch (error) {
        console.error("Error hydrating user profile:", error);
        if (!cancelled) setUser(authUser);
      }
    };

    // Initial session — clear isLoading immediately once we know the auth
    // status, then hydrate the profile in the background.
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          hydrateProfile(session.user, "INITIAL_SESSION");
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);

      if (nextSession?.user) {
        // Set the auth user immediately so the UI is interactive, then
        // refresh the profile in the background.
        setUser((prev) => prev?.id === nextSession.user.id ? prev : nextSession.user);
        hydrateProfile(nextSession.user, event);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔐 Starting registration process for:", userData.email);

      const { data, error } = await auth.signUp(
        userData.email,
        userData.password,
        {
          data: {
            name: userData.name,
          },
        }
      );

      if (error) throw error;

      console.log("✅ Registration successful:", data);

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log("📧 Email confirmation required");
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        });
        return { user: data.user, needsEmailConfirmation: true };
      }

      // If we have a session (email confirmation disabled), user is auto-logged in
      if (data.user && data.session) {
        console.log("🚀 Auto-login successful after registration");

        // Back-fill the public.users profile only if it doesn't already exist.
        // The on_auth_user_created DB trigger will normally create it; this is
        // a defensive fallback that NEVER overwrites an existing row (so an
        // existing admin/ceo role can't get downgraded to 'user').
        try {
          const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();

          if (!existing) {
            const { error: profileError } = await supabase.from("users").insert({
              id: data.user.id,
              name: userData.name,
              email: userData.email,
              role: "user",
            });
            if (profileError) {
              console.warn("⚠️ Could not create user profile:", profileError);
            } else {
              console.log("✅ User profile created successfully");
            }
          }
        } catch (profileErr) {
          console.warn("⚠️ Profile creation failed:", profileErr);
        }

        toast({
          title: "Welcome to Canvaso",
          description: "Your account is ready — enjoy the gallery.",
        });

        return { user: data.user, session: data.session, autoLoggedIn: true };
      }

      return { user: data.user };
    } catch (error) {
      console.error("❌ Registration failed:", error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await auth.signIn(
        credentials.email,
        credentials.password
      );

      if (error) {
        // Translate Supabase's terse codes into something an end-user can act
        // on. The most common one is when "Confirm email" is still toggled
        // ON in Auth → Providers → Email.
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
          const friendly = new Error(
            "This email hasn't been confirmed yet. Either click the link in your inbox, " +
              "or have the admin disable email confirmation in Supabase " +
              "(Auth → Providers → Email → Confirm email)."
          );
          setError(friendly.message);
          throw friendly;
        }
        if (msg.includes("invalid login credentials")) {
          const friendly = new Error("That email and password don't match. Try again.");
          setError(friendly.message);
          throw friendly;
        }
        throw error;
      }

      return { user: data.user };
    } catch (error) {
      if (!error.message?.startsWith("This email") && !error.message?.startsWith("That email")) {
        setError(error.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Admin login with custom credentials
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔐 Attempting login with email: ${email}`);

      // Try to login with provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log(`❌ Login failed: ${error.message}`);

        // Handle email not confirmed error (user exists but email not confirmed)
        if (error.message.includes("Email not confirmed")) {
          console.log("📧 User exists but email not confirmed");
          console.log("🔧 Attempting to handle this automatically...");

          // Try to resend confirmation email and auto-confirm if possible
          try {
            const { error: resendError } = await supabase.auth.resend({
              type: "signup",
              email: email,
            });

            if (!resendError) {
              console.log(
                "📬 Confirmation email resent. Please check email or disable email confirmation in Supabase."
              );
            }
          } catch (resendErr) {
            console.log("ℹ️ Could not resend confirmation email");
          }

          toast({
            title: "❌ Email Confirmation Required",
            description:
              "Please delete the admin user in Supabase Dashboard → Authentication → Users, then try again.",
            variant: "destructive",
          });

          throw new Error(
            "SOLUTION: Go to Supabase Dashboard → Authentication → Users → Delete admin@amanarts.com → Try login again (fresh user will be created automatically)."
          );
        }

        // If login fails due to invalid credentials, try to register the admin user first
        if (error.message.includes("Invalid login credentials")) {
          console.log("👤 Admin user not found, creating admin account...");

          const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: "Admin User",
                },
              },
            });

          if (signUpError) {
            console.log(`❌ Sign up failed: ${signUpError.message}`);
            throw signUpError;
          }

          console.log("✅ Admin account created, attempting login...");

          toast({
            title: "Admin account created",
            description: "Admin user created successfully. Logging in...",
          });

          // After creating, try to login again
          const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (loginError) {
            console.log(`❌ Login after signup failed: ${loginError.message}`);

            // If still can't login, it's likely due to email confirmation
            if (loginError.message.includes("Email not confirmed")) {
              toast({
                title: "Email confirmation required",
                description:
                  "Please disable email confirmation in Supabase Dashboard → Authentication → Settings",
                variant: "destructive",
              });
              throw new Error(
                "Email confirmation is enabled. Please disable it in Supabase Auth settings."
              );
            }
            throw loginError;
          }

          // Use the successful login data
          return await handleSuccessfulLogin(loginData.user);
        } else {
          throw error;
        }
      } else {
        // Direct login was successful
        console.log("✅ Direct login successful");
        return await handleSuccessfulLogin(data.user);
      }
    } catch (error) {
      console.error("💥 Admin login error:", error);
      setError(error.message);
      toast({
        title: "Admin login failed",
        description: error.message,
        variant: "destructive",
      });
      return false; // Return false for failure
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to handle successful login
  const handleSuccessfulLogin = async (user) => {
    if (user) {
      try {
        // Read the existing profile (if any) so we don't trample an existing
        // 'admin'/'ceo' role with something weaker.
        const { data: existing } = await supabase
          .from("users")
          .select("role, name")
          .eq("id", user.id)
          .maybeSingle();

        const desiredRole =
          existing?.role === "ceo" || existing?.role === "admin"
            ? existing.role
            : "admin";

        const { data: upserted, error: updateError } = await supabase
          .from("users")
          .upsert({
            id: user.id,
            email: user.email,
            name:
              existing?.name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Admin",
            role: desiredRole,
          })
          .select()
          .maybeSingle();

        if (updateError) {
          console.warn("⚠️ Could not write admin profile row:", updateError);
        }

        setUser({
          ...user,
          ...(upserted || {}),
          role: upserted?.role || desiredRole,
        });
      } catch (roleError) {
        console.warn("⚠️ Profile sync failed:", roleError);
        setUser(user);
      }
    }

    toast({
      title: "Admin login successful",
      description: "Welcome to the curator panel.",
    });

    return true;
  };

  /** One-click demo curator login.
   *
   *  This project ships in "portfolio mode" — recruiters and visitors can
   *  press a button on the admin login page and land directly in the admin
   *  panel. Credentials come from `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD`
   *  with sensible fallbacks. Both are deliberately public; for a real
   *  production gallery you would remove this helper and require a real
   *  password. */
  const demoAdminLogin = async () => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@amanarts.com";
    const adminPassword =
      import.meta.env.VITE_ADMIN_PASSWORD || "amantheadmin";
    return await adminLogin(adminEmail, adminPassword);
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🚪 Starting logout process...");
      const currentUser = user;

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("❌ Logout error:", error);
        throw error;
      }

      console.log("✅ Successfully signed out from Supabase");

      // Clear local state immediately
      setUser(null);
      setSession(null);
      setError(null);

      // If this is an admin user, log the cleanup
      if (currentUser && isAdmin()) {
        console.log("🧹 Admin user logged out");
      }

      console.log("🎉 Logout completed successfully");

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("💥 Logout failed:", error);
      setError(error.message);

      // Even if there's an error, try to clear local state
      setUser(null);
      setSession(null);

      toast({
        title: "Logout Error",
        description:
          "There was an issue logging out, but you've been signed out locally.",
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error("No user logged in");

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔐 Sending password reset email to:", email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      console.log("✅ Password reset email sent successfully");

      toast({
        title: "Password reset email sent",
        description:
          "Please check your email for instructions to reset your password.",
      });

      return true;
    } catch (error) {
      console.error("❌ Password reset failed:", error);
      setError(error.message);

      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔐 Updating password...");

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      console.log("✅ Password updated successfully");

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });

      return true;
    } catch (error) {
      console.error("❌ Password update failed:", error);
      setError(error.message);

      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const resetLoadingState = () => {
    setIsLoading(false);
    setError(null);
  };

  /** Match the SQL `is_admin()` function: role IN ('admin','ceo'). */
  const isAdmin = () => {
    if (user?.role === "admin" || user?.role === "ceo") return true;

    // Defensive fallback for the very first signup before the
    // public.users row has been hydrated. Hard-coded sentinel emails — never
    // an env var, since anything VITE_-prefixed would ship to every browser.
    const FALLBACK_ADMIN_EMAILS = new Set([
      "admin@amanarts.com",
      "iflaqkhurshid@gmail.com",
    ]);
    if (user?.email && FALLBACK_ADMIN_EMAILS.has(user.email)) return true;

    return false;
  };
  const isCEO = () => user?.role === "ceo";

  const value = {
    user,
    session,
    isLoading,
    error,
    register,
    login,
    adminLogin,
    demoAdminLogin,
    logout,
    updateProfile,
    resetPassword,
    updatePassword,
    clearError,
    resetLoadingState,
    isAdmin,
    isCEO,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
