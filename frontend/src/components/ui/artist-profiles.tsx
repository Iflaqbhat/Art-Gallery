import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicDb } from "@/lib/supabase-public";

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
};

const cleanImg = (raw: string | null | undefined): string | null => {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t.length || t.includes("placeholder.svg")) return null;
  return t;
};

const ArtistProfiles: React.FC = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["public", "artists", "profiles"],
    queryFn: () => publicDb.getArtists(),
    staleTime: 120 * 1000,
    retry: 1,
  });

  type Profile = { id: string; name: string; image: string | null };
  const merged: Profile[] = Array.isArray(data)
    ? data.map((a) => ({
        id: String(a.id),
        name: String(a.name ?? "Artist"),
        image: cleanImg(a.image_url),
      }))
    : [];

  // No artists in the DB yet → render nothing rather than fake portraits.
  if (!isLoading && merged.length === 0) return null;

  return (
    <section className="mb-20 sm:mb-28">
      <div className="px-4 sm:px-6 lg:px-10 mb-7 flex items-end justify-between gap-6">
        <div>
          <p className="gallery-eyebrow mb-3">— The voices behind the work</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ivory leading-none">
            Artists in residence
          </h2>
        </div>
        <Link
          to="/artists"
          className="font-mono text-[11px] tracking-[0.28em] uppercase text-champagne hover:text-ivory transition-colors shrink-0"
        >
          View all →
        </Link>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto scrollbar-hide" aria-busy="true">
          <div className="flex gap-6 px-4 sm:px-6 lg:px-10 pb-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-secondary animate-pulse mb-3 rounded-full mx-auto" />
                <div className="w-24 h-3 bg-secondary animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-7 px-4 sm:px-6 lg:px-10 pb-2">
            {merged.slice(0, 16).map((artist) => (
              <Link
                key={artist.id}
                to="/artists"
                className="flex-shrink-0 text-center group w-24 sm:w-28"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3 rounded-full overflow-hidden border border-border group-hover:border-champagne transition-all bg-secondary">
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt=""
                      className="w-full h-full object-cover transition-slow group-hover:scale-110"
                      style={{ filter: "grayscale(0.3) saturate(0.9)" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary via-warmblack to-secondary flex items-center justify-center">
                      <span className="font-display text-2xl sm:text-3xl text-champagne/70">
                        {initialsOf(artist.name)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-display text-base text-ivory/85 truncate group-hover:text-champagne transition-colors">
                  {artist.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ArtistProfiles;
