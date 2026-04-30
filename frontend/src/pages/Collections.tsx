import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicDb, supabasePublic } from "@/lib/supabase-public";
import { PLACEHOLDER_COLLECTIONS } from "@/lib/media-placeholders";

type CollectionRow = {
  id: string;
  title: string;
  description?: string | null;
  banner_image_url?: string | null;
  created_at?: string;
  artworks?: { id: string }[] | null;
  artworkCount?: number;
};

async function fetchCollectionsPage(): Promise<CollectionRow[]> {
  try {
    const { data, error } = await supabasePublic
      .from("collections")
      .select(
        `
        *,
        artworks ( id )
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data?.length) {
      return data.map((c: Record<string, unknown>) => ({
        ...c,
        artworkCount:
          Array.isArray(c.artworks) && c.artworks.length
            ? c.artworks.length
            : 0,
      })) as CollectionRow[];
    }
  } catch {
    /* fall through */
  }

  const base = await publicDb.getCollections();
  return (base || []).map((c) => ({ ...c, artworkCount: 0 }));
}

const bannerOrPlaceholder = (
  raw: string | null | undefined,
  index: number
): string =>
  typeof raw === "string" &&
  raw.trim().length &&
  raw !== "/placeholder.svg"
    ? raw
    : PLACEHOLDER_COLLECTIONS[index % PLACEHOLDER_COLLECTIONS.length];

const Collections: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const tab = searchParams.get("view") === "recent" ? "recent" : "all";

  const {
    data: collections = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["collections", "gallery"],
    queryFn: fetchCollectionsPage,
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    let rows = [...collections];
    if (tab === "recent") {
      rows.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [collections, tab, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Header */}
          <header className="mb-14 sm:mb-20 reveal-up">
            <p className="gallery-eyebrow mb-5">— Browse the archive</p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-[112px] text-ivory leading-[0.9] tracking-tight mb-6">
              Collections
            </h1>
            <p className="font-display italic text-champagne text-xl sm:text-2xl mb-3">
              Every series opens into its own room.
            </p>
            <p className="text-muted-foreground max-w-2xl leading-relaxed text-sm sm:text-base">
              Works grouped by theme, museum-style. Each card is a doorway —
              tap any to enter.
            </p>
          </header>

          {/* Filter bar */}
          <div className="border-y border-border py-5 mb-14 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              <input
                type="search"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-transparent border border-border text-ivory placeholder:text-muted-foreground/60 font-mono text-xs tracking-[0.16em] uppercase focus:outline-none focus:border-champagne/60 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px] tracking-[0.28em] uppercase">
              <button
                onClick={() => {
                  searchParams.delete("view");
                  setSearchParams(searchParams);
                }}
                className={`px-4 py-2.5 transition-colors ${
                  tab === "all"
                    ? "text-champagne border-b border-champagne"
                    : "text-ivory/60 hover:text-ivory border-b border-transparent"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  searchParams.set("view", "recent");
                  setSearchParams(searchParams);
                }}
                className={`px-4 py-2.5 transition-colors ${
                  tab === "recent"
                    ? "text-champagne border-b border-champagne"
                    : "text-ivory/60 hover:text-ivory border-b border-transparent"
                }`}
              >
                Recent
              </button>
              <span className="ml-4 text-muted-foreground">
                · {filtered.length} {filtered.length === 1 ? "room" : "rooms"}
              </span>
            </div>
          </div>

          {/* Loading */}
          {isPending && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] border border-border bg-secondary/40 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="border border-destructive/30 bg-card p-10 text-center max-w-xl mx-auto">
              <p className="gallery-eyebrow mb-3">— Notice</p>
              <p className="font-display text-2xl text-ivory mb-4">
                Could not load collections
              </p>
              <button onClick={() => refetch()} className="btn-gallery-ghost">
                Retry
              </button>
            </div>
          )}

          {/* Grid */}
          {!isPending && !isError && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
                {filtered.map((collection, index) => (
                  <Link
                    key={collection.id}
                    to={`/collection/${collection.id}`}
                    className="group block reveal-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <article className="space-y-5">
                      {/* Frame */}
                      <div className="relative overflow-hidden bg-secondary aspect-[4/5] border border-border group-hover:border-champagne/50 transition-smooth">
                        <img
                          src={bannerOrPlaceholder(
                            collection.banner_image_url,
                            index
                          )}
                          alt=""
                          className="w-full h-full object-cover transition-slow group-hover:scale-105"
                          style={{ filter: "saturate(0.9)" }}
                          onError={(e) => {
                            e.currentTarget.src =
                              PLACEHOLDER_COLLECTIONS[
                                index % PLACEHOLDER_COLLECTIONS.length
                              ];
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-warmblack/70 to-transparent opacity-80 group-hover:opacity-50 transition-opacity" />

                        {/* Plate */}
                        <div className="absolute left-4 top-4 right-4 flex items-center justify-between">
                          <span className="gallery-plate">
                            Room · {String(index + 1).padStart(2, "0")}
                          </span>
                          {typeof collection.artworkCount === "number" &&
                            collection.artworkCount > 0 && (
                              <span className="gallery-plate">
                                {collection.artworkCount} works
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Caption */}
                      <div className="px-1 space-y-3">
                        <h2 className="font-display text-2xl sm:text-3xl text-ivory leading-tight group-hover:text-champagne transition-colors line-clamp-2">
                          {collection.title}
                        </h2>
                        {collection.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 font-light">
                            {collection.description}
                          </p>
                        )}
                        <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-champagne/80 pt-1">
                          Open the room →
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-24 text-muted-foreground italic font-display text-xl">
                  No collections match your search.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Collections;
