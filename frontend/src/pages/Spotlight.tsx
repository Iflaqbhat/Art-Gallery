import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { PLACEHOLDER_COLLECTIONS } from "@/lib/media-placeholders";

const SpotlightPage: React.FC = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      {/* Hero section */}
      <section className="relative h-[80vh] flex items-end overflow-hidden">
        <img
          src={PLACEHOLDER_COLLECTIONS[1]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(0.85) contrast(1.05)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-warmblack via-warmblack/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-warmblack/60 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pb-16 sm:pb-24 w-full">
          <div className="reveal-up max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="gallery-divider" />
              <p className="gallery-eyebrow">— Spotlight</p>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-[88px] text-ivory leading-[0.9] tracking-tight mb-5">
              This season's
              <br />
              <span className="italic text-champagne">refrain.</span>
            </h1>
            <p className="text-ivory/80 text-base sm:text-lg leading-relaxed font-light max-w-xl">
              Spotlight is where we frame one mood at a time — light, pigment,
              silence, rhythm. A single thread we pull on for the season.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial body */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28 space-y-20">
        {/* Pull-quote */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="gallery-eyebrow mb-6">— Curatorial note</p>
          <p className="font-display text-3xl sm:text-4xl text-ivory leading-snug">
            <span className="italic text-champagne">"Quiet monuments."</span> A study in
            negative space — works that reclaim the room without raising a voice.
          </p>
        </div>

        {/* Two-column editorial */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <img
              src={PLACEHOLDER_COLLECTIONS[0]}
              alt=""
              className="w-full aspect-[4/5] object-cover border border-border"
              style={{ filter: "saturate(0.9)" }}
            />
            <div className="absolute -bottom-4 left-4 bg-card border border-border px-4 py-2">
              <span className="gallery-plate">№ 01 · This room</span>
            </div>
          </div>
          <div className="space-y-6">
            <p className="gallery-eyebrow">— A single thread</p>
            <h2 className="font-display text-4xl sm:text-5xl text-ivory leading-tight">
              Works that reclaim
              <br />
              <span className="italic text-champagne">the room without shouting.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed font-light">
              We rotate Spotlight every six to eight weeks. Curatorial notes
              appear here as we onboard each cycle — a small, focused
              conversation rather than a sprawling catalogue.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.32em] uppercase text-champagne hover:text-ivory transition-colors"
            >
              See the rooms <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Coming up panel */}
        <div className="border border-border bg-card p-10 sm:p-14 text-center">
          <p className="gallery-eyebrow mb-5">— Coming next</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ivory mb-4">
            The next refrain is being framed.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 font-light leading-relaxed">
            For now, wander the library — every collection carries its own
            quiet narration.
          </p>
          <Link to="/artists" className="btn-gallery-ghost">
            Meet the artists
          </Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default SpotlightPage;
