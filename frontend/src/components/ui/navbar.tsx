import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/SupabaseAuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/ui/logo";
import { LogOut, Shield, Menu, X } from "lucide-react";

interface UserShape {
  name?: string;
  email?: string;
  avatar?: string;
}

const navLinks: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/collections", label: "Collections" },
  { to: "/artists", label: "Artists" },
  { to: "/spotlight", label: "Spotlight" },
];

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth() as {
    user?: UserShape;
    isAuthenticated: boolean;
    isAdmin: () => boolean;
    logout: () => Promise<void>;
  };
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogoTap = () => {
    if (isAuthenticated) {
      navigate("/");
      return;
    }
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 4) {
      navigate("/admin/secret-login-panel-2024");
      setLogoTaps(0);
      return;
    }
    setTimeout(() => setLogoTaps(0), 2500);
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "G";

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[hsl(30_12%_5%/0.85)] backdrop-blur-lg border-b border-border"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo (left) */}
            <Logo onClick={handleLogoTap} />

            {/* Desktop links (center-ish) */}
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative font-mono text-[11px] tracking-[0.3em] uppercase transition-colors ${
                    isActive(link.to)
                      ? "text-champagne"
                      : "text-ivory/70 hover:text-ivory"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-2 left-0 right-0 h-px bg-champagne origin-center transition-transform duration-300 ${
                      isActive(link.to) ? "scale-x-100" : "scale-x-0 hover:scale-x-100"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Right side — auth */}
            <div className="flex items-center gap-3 sm:gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full p-0.5 ring-1 ring-border hover:ring-champagne/60 transition-all">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-secondary text-champagne text-xs font-mono">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 mt-2 bg-card border-border font-mono text-xs"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal py-3">
                      <div className="space-y-1">
                        <p className="text-sm font-sans text-ivory leading-none">
                          {user?.name || "Visitor"}
                        </p>
                        <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {isAdmin() && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin"
                            className="cursor-pointer text-champagne uppercase tracking-[0.2em] text-[10px]"
                          >
                            <Shield className="mr-2 h-3.5 w-3.5" />
                            Admin
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => logout().then(() => navigate("/"))}
                      className="cursor-pointer text-terracotta uppercase tracking-[0.2em] text-[10px]"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/admin/secret-login-panel-2024"
                    className="inline-flex items-center font-mono text-[11px] tracking-[0.28em] uppercase text-ivory/85 hover:text-champagne border border-border hover:border-champagne/60 px-4 py-2.5 transition-all"
                    title="Curator / admin sign in"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    Admin
                  </Link>
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center font-mono text-[11px] tracking-[0.28em] uppercase text-ivory hover:text-champagne border border-border hover:border-champagne/60 px-4 py-2.5 transition-all"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/auth/register"
                    className="font-mono text-[11px] tracking-[0.28em] uppercase text-warmblack bg-champagne hover:bg-ivory px-4 py-2.5 border border-champagne hover:border-ivory transition-colors"
                  >
                    Become a member
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-2 text-ivory/80 hover:text-ivory transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-background/98 backdrop-blur-xl pt-24 px-6 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between border-b border-border py-5 font-display text-3xl ${
                  isActive(link.to) ? "text-champagne" : "text-ivory"
                }`}
              >
                <span>{link.label}</span>
                <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
                  {String(navLinks.findIndex((l) => l.to === link.to) + 1).padStart(2, "0")}
                </span>
              </Link>
            ))}
          </div>
          {!isAuthenticated && (
            <div className="mt-10 flex flex-col gap-3">
              <Link
                to="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="btn-gallery-ghost text-center w-full"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="btn-gallery text-center w-full"
              >
                Become a member
              </Link>
              <Link
                to="/admin/secret-login-panel-2024"
                onClick={() => setMobileOpen(false)}
                className="font-mono text-[11px] tracking-[0.28em] uppercase text-center text-ivory/70 hover:text-champagne border border-border py-3 transition-colors"
              >
                <Shield className="inline h-3.5 w-3.5 mr-2" />
                Admin sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;
