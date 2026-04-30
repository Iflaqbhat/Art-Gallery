import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin } from "lucide-react";
import { BRAND_NAME, BRAND_FULL_TAGLINE, BRAND_EST } from "@/lib/brand";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-card mt-16">
      {/* Hairline gold above the footer */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand column */}
          <div className="md:col-span-5 space-y-5">
            <p className="gallery-eyebrow">— {BRAND_NAME} · {BRAND_EST}</p>
            <h2 className="font-display text-4xl sm:text-5xl text-ivory leading-tight">
              A quiet gallery,
              <br />
              <span className="italic text-champagne">curated one room</span>
              <br />
              at a time.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md font-light">
              {BRAND_FULL_TAGLINE} We don't sell scrolls of pixels — we frame
              works that ask for stillness.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-2 space-y-3">
            <p className="gallery-eyebrow mb-5">Wander</p>
            <ul className="space-y-3 font-mono text-[12px] tracking-[0.16em] uppercase">
              <li>
                <Link to="/collections" className="text-ivory/80 hover:text-champagne transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link to="/artists" className="text-ivory/80 hover:text-champagne transition-colors">
                  Artists
                </Link>
              </li>
              <li>
                <Link to="/spotlight" className="text-ivory/80 hover:text-champagne transition-colors">
                  Spotlight
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="gallery-eyebrow mb-5">Visit</p>
            <ul className="space-y-3 font-mono text-[12px] tracking-[0.16em] uppercase">
              <li>
                <Link to="/auth/login" className="text-ivory/80 hover:text-champagne transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/auth/register" className="text-ivory/80 hover:text-champagne transition-colors">
                  Members
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/secret-login-panel-2024"
                  className="text-ivory/55 hover:text-champagne transition-colors"
                >
                  Curator
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / social */}
          <div className="md:col-span-3 space-y-4">
            <p className="gallery-eyebrow mb-5">In touch</p>
            <a
              href="mailto:hello@canvaso.art"
              className="flex items-start gap-3 text-ivory/80 hover:text-champagne transition-colors group"
            >
              <Mail className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="font-mono text-[11px] tracking-[0.16em] break-all">
                hello@canvaso.art
              </span>
            </a>
            <div className="flex items-start gap-3 text-ivory/60">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="font-mono text-[11px] tracking-[0.16em]">
                By appointment
              </span>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-10 w-10 border border-border text-ivory/70 hover:text-champagne hover:border-champagne/50 transition-all"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
            © {year} {BRAND_NAME} — All works belong to their respective artists.
          </p>
          <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
            Crafted with quiet — Kashmir
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
