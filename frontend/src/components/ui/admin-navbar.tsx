import React, { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Logo from "@/components/ui/logo";
import {
  Users,
  Palette,
  Layers,
  LogOut,
  Menu,
  X,
  Plus,
  Edit3,
  Eye,
  LayoutDashboard,
  Mail,
} from "lucide-react";

interface AdminNavbarProps {
  onEditBanner?: () => void;
}

const navItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Collections", href: "/admin/collections", icon: Layers },
  { title: "Artworks", href: "/admin/artworks", icon: Palette },
  { title: "Artists", href: "/admin/artists", icon: Users },
  { title: "Inquiries", href: "/admin/inquiries", icon: Mail },
];

type AuthShape = {
  user?: { name?: string; email?: string } | null;
  logout: () => Promise<void>;
};

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onEditBanner }) => {
  const { user, logout } = useAuth() as AuthShape;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const isActive = (href: string) =>
    href === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Logo variant="admin" />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 border border-champagne/30 bg-champagne/10 font-mono text-[9px] tracking-[0.32em] uppercase text-champagne">
              Curator
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`relative font-mono text-[11px] tracking-[0.28em] uppercase transition-colors py-2 ${
                  isActive(item.href)
                    ? "text-champagne"
                    : "text-ivory/70 hover:text-ivory"
                }`}
              >
                {item.title}
                <span
                  className={`absolute -bottom-1 left-0 right-0 h-px bg-champagne origin-center transition-transform duration-300 ${
                    isActive(item.href) ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {onEditBanner && (
              <button
                onClick={onEditBanner}
                className="font-mono text-[11px] tracking-[0.24em] uppercase text-ivory/70 hover:text-champagne px-3 py-2 border border-border hover:border-champagne/50 transition-colors"
              >
                <Edit3 className="inline h-3 w-3 mr-1.5" />
                Banner
              </button>
            )}
            <Link
              to="/admin/artworks/new"
              className="font-mono text-[11px] tracking-[0.24em] uppercase text-warmblack bg-champagne hover:bg-ivory px-4 py-2 transition-colors"
            >
              <Plus className="inline h-3.5 w-3.5 mr-1.5" />
              Add work
            </Link>
            <Link
              to="/"
              className="text-ivory/60 hover:text-champagne p-2 transition-colors"
              title="View public site"
            >
              <Eye className="h-4 w-4" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-0.5 ring-1 ring-border hover:ring-champagne/60 transition-all">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-champagne text-xs font-mono">
                      {user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 mt-2 bg-card border-border"
                align="end"
              >
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="space-y-1">
                    <p className="text-sm font-sans text-ivory leading-none">
                      {user?.name || "Curator"}
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                      {user?.email || "Authorized"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-terracotta uppercase tracking-[0.2em] text-[10px] font-mono"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-ivory/80 p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 font-mono text-[11px] tracking-[0.24em] uppercase border-b border-border ${
                  isActive(item.href)
                    ? "text-champagne"
                    : "text-ivory/80 hover:text-ivory"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              <Link
                to="/admin/artworks/new"
                onClick={() => setMobileOpen(false)}
                className="btn-gallery w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add new work
              </Link>
              {onEditBanner && (
                <button
                  onClick={() => {
                    onEditBanner();
                    setMobileOpen(false);
                  }}
                  className="btn-gallery-ghost w-full"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit banner
                </button>
              )}
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="btn-gallery-ghost w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                View public site
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full font-mono text-[11px] tracking-[0.24em] uppercase text-terracotta py-3"
              >
                <LogOut className="inline h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavbar;
