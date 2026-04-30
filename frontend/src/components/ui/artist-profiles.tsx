import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicDb } from "@/lib/supabase-public";
import { PLACEHOLDER_ARTISTS } from "@/lib/media-placeholders";

const ArtistProfiles: React.FC = () => {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["public", "artists", "profiles"],
    queryFn: () => publicDb.getArtists(),
    staleTime: 120 * 1000,
    retry: 1,
  });

  type Profile = { id: string; name: string; displayImage: string };
  let merged: Profile[];

  if (Array.isArray(data) && data.length > 0) {
    merged = data.map((a, i: number) => {
      const fallback = PLACEHOLDER_ARTISTS[i % PLACEHOLDER_ARTISTS.length];
      const img = String(a.image_url ?? "");
      const useFallback = !img.trim().length || img.includes("placeholder.svg");
      return {
        id: String(a.id),
        name: String(a.name ?? "Artist"),
        displayImage: useFallback ? fallback.image_url : img,
      };
    });
  } else {
    merged = PLACEHOLDER_ARTISTS.map((p) => ({
      id: p.id,
      name: p.name,
      displayImage: p.image_url,
    }));
  }

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

      {isError && (
        <p className="px-4 sm:px-6 lg:px-10 text-ivory/50 text-xs mb-3 italic">
          Showing curated portraits — live profiles will appear once your gallery has artists.
        </p>
      )}

      {isLoading && !merged.length ? (
        <div className="overflow-x-auto scrollbar-hide">
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
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-3 rounded-full overflow-hidden border border-border group-hover:border-champagne transition-all">
                  <img
                    src={artist.displayImage}
                    alt=""
                    className="w-full h-full object-cover transition-slow group-hover:scale-110"
                    style={{ filter: "grayscale(0.3) saturate(0.9)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        PLACEHOLDER_ARTISTS[0].image_url;
                    }}
                  />
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
