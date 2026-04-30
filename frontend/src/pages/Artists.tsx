import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { publicDb } from "@/lib/supabase-public";
import { PLACEHOLDER_ARTISTS } from "@/lib/media-placeholders";

const ArtistsPage: React.FC = () => {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["public", "artists", "page"],
    queryFn: () => publicDb.getArtists(),
    staleTime: 120 * 1000,
  });

  const artists =
    raw.length > 0
      ? raw.map((a, i: number) => ({
          id: String(a.id),
          name: String(a.name ?? "Artist"),
          image:
            typeof a.image_url === "string" &&
            a.image_url.length > 0 &&
            !a.image_url.includes("placeholder.svg")
              ? a.image_url
              : PLACEHOLDER_ARTISTS[i % PLACEHOLDER_ARTISTS.length].image_url,
          bio: a.bio ? String(a.bio) : "",
        }))
      : PLACEHOLDER_ARTISTS.map((p, i) => ({
          id: p.id + String(i),
          name: p.name,
          image: p.image_url,
          bio: "Featured creator — Maison Aman curated roster.",
        }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <header className="mb-16 sm:mb-24 max-w-3xl reveal-up">
            <p className="gallery-eyebrow mb-5">— The roster</p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-[112px] text-ivory leading-[0.9] tracking-tight mb-6">
              Artists in
              <br />
              <span className="italic text-champagne">residence</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg font-light">
              The painters, sculptors, and collaborators behind every work on view
              — a living archive that grows with each season.
            </p>
          </header>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div
                  key={k}
                  className="border border-border bg-secondary/40 aspect-[4/5] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-14">
              {artists.map((artist, idx) => (
                <article key={artist.id} className="group reveal-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-5 border border-border group-hover:border-champagne/50 transition-smooth">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover transition-slow group-hover:scale-105"
                      style={{ filter: "grayscale(0.25) saturate(0.9)" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          PLACEHOLDER_ARTISTS[0].image_url;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-warmblack/60 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4">
                      <span className="gallery-plate">
                        № {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <div className="px-1 space-y-2">
                    <h2 className="font-display text-3xl text-ivory leading-tight">
                      {artist.name}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 font-light">
                      {artist.bio || "Part of the Maison Aman collective."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-20 sm:mt-28 text-center">
            <span className="gallery-divider mx-auto block" />
            <Link
              to="/collections"
              className="inline-block mt-8 font-mono text-[11px] tracking-[0.32em] uppercase text-champagne hover:text-ivory transition-colors"
            >
              Browse the collections →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtistsPage;
