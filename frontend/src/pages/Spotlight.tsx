import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { publicDb } from "@/lib/supabase-public";

const cleanImg = (raw: string | null | undefined): string | null => {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t.length || t === "/placeholder.svg") return null;
  return t;
};

const SpotlightPage: React.FC = () => {
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["public", "collections", "spotlight"],
    queryFn: () => publicDb.getCollections(),
    staleTime: 60 * 1000,
  });

  const { hero, secondary } = useMemo(() => {
    const withImages = (collections || [])
      .map((c) => ({
        id: String(c.id),
        title: String(c.title ?? ""),
        image: cleanImg(c.banner_image_url),
      }))
      .filter((c) => Boolean(c.image));
    return {
      hero: withImages[0] ?? null,
      secondary: withImages[1] ?? null,
    };
  }, [collections]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero — uses the most recent collection's banner from Supabase, or
            falls back to a clean dark editorial backdrop with no imagery. */}
        <section className="relative h-[80vh] flex items-end overflow-hidden bg-warmblack">
          {isLoading ? (
            <div
              className="absolute inset-0 bg-gradient-to-br from-warmblack via-warmblack to-secondary/30 animate-pulse"
              aria-busy="true"
            />
          ) : hero ? (
            <>
              <img
                src={hero.image as string}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "saturate(0.85) contrast(1.05)" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-warmblack via-warmblack/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-warmblack/60 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-warmblack via-warmblack to-secondary/30" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,_rgba(198,107,61,0.08),transparent_60%)]" />
            </div>
          )}

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

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28 space-y-20">
          <div className="text-center max-w-3xl mx-auto">
            <p className="gallery-eyebrow mb-6">— Curatorial note</p>
            <p className="font-display text-3xl sm:text-4xl text-ivory leading-snug">
              <span className="italic text-champagne">"Quiet monuments."</span> A study in
              negative space — works that reclaim the room without raising a voice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              {isLoading ? (
                <div className="w-full aspect-[4/5] bg-secondary/40 border border-border animate-pulse" />
              ) : secondary ? (
                <img
                  src={secondary.image as string}
                  alt=""
                  className="w-full aspect-[4/5] object-cover border border-border"
                  style={{ filter: "saturate(0.9)" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full aspect-[4/5] border border-border bg-gradient-to-br from-secondary via-warmblack to-secondary/60 flex items-center justify-center">
                  <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/30">
                    Image pending
                  </span>
                </div>
              )}
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
};

export default SpotlightPage;
