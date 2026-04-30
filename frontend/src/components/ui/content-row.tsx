import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  /** Image URL from the backend. Empty string / null = no image, the
   *  card falls back to a neutral textured frame (no stock photo). */
  image: string | null;
  year?: string;
  duration?: string;
}

interface ContentRowProps {
  title: string;
  /** Optional small italic descriptor under the title */
  caption?: string;
  items: ContentItem[];
  linkType?: "collection" | "artwork";
  isAuthenticated?: boolean;
}

const ContentRow: React.FC<ContentRowProps> = ({
  title,
  caption,
  items,
  linkType = "collection",
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (!items?.length) return null;

  return (
    <section className="mb-14 sm:mb-20">
      {/* Heading row */}
      <div className="px-4 sm:px-6 lg:px-10 mb-7 flex items-end justify-between gap-6">
        <div>
          <p className="gallery-eyebrow mb-3">— {linkType === "collection" ? "Curation" : "Selection"}</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ivory leading-none">
            {title}
          </h2>
          {caption && (
            <p className="font-display italic text-muted-foreground text-sm mt-2">
              {caption}
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => scrollBy(-400)}
            aria-label="Scroll left"
            className="h-10 w-10 border border-border text-ivory/60 hover:text-champagne hover:border-champagne/50 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(400)}
            aria-label="Scroll right"
            className="h-10 w-10 border border-border text-ivory/60 hover:text-champagne hover:border-champagne/50 transition-all flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroller */}
      <div className="overflow-x-auto scrollbar-hide" ref={scrollerRef}>
        <div className="flex gap-5 px-4 sm:px-6 lg:px-10 pb-2">
          {items.map((item, idx) => (
            <Link
              key={item.id}
              to={
                linkType === "collection"
                  ? `/collection/${item.id}`
                  : `/artwork/${item.id}`
              }
              className="group flex-shrink-0 w-[260px] sm:w-[300px] block"
            >
              {/* Frame */}
              <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4 transition-smooth border border-border group-hover:border-champagne/40">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="w-full h-full object-cover transition-slow group-hover:scale-[1.06]"
                    style={{ filter: "saturate(0.92)" }}
                    onError={(e) => {
                      // Hide a broken backend URL rather than swap to stock —
                      // the frame's background does the work.
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/70 to-warmblack flex items-center justify-center">
                    <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/30">
                      Image pending
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-warmblack/80 via-transparent to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />

                {/* Plate (museum-tag style) — bottom-left */}
                <div className="absolute left-3 bottom-3 right-3 flex items-center justify-between">
                  <span className="gallery-plate">
                    No · {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="px-1 space-y-1">
                <h3 className="font-display text-xl text-ivory leading-tight transition-colors group-hover:text-champagne line-clamp-1">
                  {item.title}
                </h3>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                  {item.year ?? "Undated"} · {linkType === "collection" ? "Curation" : "Work"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentRow;
