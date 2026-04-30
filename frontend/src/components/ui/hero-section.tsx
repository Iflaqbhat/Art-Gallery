import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { publicDb } from "@/lib/supabase-public";
import { BRAND_EST } from "@/lib/brand";

interface FeaturedContent {
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  cta_text?: string;
  cta_link?: string;
}

const FEATURED_CONTENT_CACHE_KEY = "featured-content-public";

const HeroSection: React.FC = () => {
  const { data: featured, isLoading } = useQuery({
    queryKey: [FEATURED_CONTENT_CACHE_KEY],
    queryFn: async (): Promise<FeaturedContent | null> => {
      const row = await publicDb.getFeaturedContent();
      if (!row?.title) return null;
      const raw =
        row.image_url ||
        (row as { banner_image_url?: string }).banner_image_url ||
        null;
      const cleaned =
        typeof raw === "string" && raw.trim().length && raw !== "/placeholder.svg"
          ? raw.trim()
          : null;
      return {
        title: String(row.title),
        subtitle: row.subtitle != null ? String(row.subtitle) : "Featured",
        description:
          row.description != null
            ? String(row.description)
            : "A curated room — selected works on view.",
        image_url: cleaned,
        cta_text: row.cta_text ? String(row.cta_text) : undefined,
        cta_link: row.cta_link ? String(row.cta_link) : undefined,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
  });

  // While loading, render a full-bleed skeleton with no image at all —
  // this avoids the flash of stale/stock imagery the previous
  // implementation suffered from.
  if (isLoading) {
    return (
      <section
        aria-busy="true"
        className="relative w-full overflow-hidden bg-warmblack"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-warmblack via-warmblack to-secondary/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(198,107,61,0.06),transparent_60%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-20 sm:pt-44 sm:pb-32 min-h-[88vh] flex flex-col justify-end">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-champagne/30" />
              <div className="h-3 w-40 bg-secondary animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-14 sm:h-20 w-full max-w-3xl bg-secondary/70 animate-pulse" />
              <div className="h-14 sm:h-20 w-3/4 max-w-2xl bg-secondary/60 animate-pulse" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full max-w-xl bg-secondary/50 animate-pulse" />
              <div className="h-4 w-2/3 max-w-md bg-secondary/40 animate-pulse" />
            </div>
            <div className="flex gap-3 pt-4">
              <div className="h-12 w-44 bg-secondary/60 animate-pulse" />
              <div className="h-12 w-44 bg-secondary/40 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Editorial fallback when no featured content is configured in the DB —
  // text-only, no stock imagery.
  const content: FeaturedContent =
    featured ?? {
      title: "A quiet gallery, curated one room at a time.",
      subtitle: "On view",
      description:
        "Canvaso is a curated art house — paintings, sculpture, and contemporary works selected with intention. Step into stillness.",
      image_url: null,
    };

  const hasImage = Boolean(content.image_url);

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        {hasImage ? (
          <img
            src={content.image_url as string}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "saturate(0.85) contrast(1.05)" }}
          />
        ) : (
          // Image-less fallback: warm dark backdrop with a subtle radial
          // wash. No third-party imagery.
          <div className="absolute inset-0 bg-warmblack">
            <div className="absolute inset-0 bg-gradient-to-br from-warmblack via-warmblack to-secondary/30" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(198,107,61,0.08),transparent_60%)]" />
          </div>
        )}
        {hasImage && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-warmblack via-warmblack/85 to-warmblack/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-warmblack via-transparent to-warmblack/40" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-20 sm:pt-44 sm:pb-32 min-h-[88vh] flex flex-col justify-end">
        <div className="max-w-3xl space-y-7 reveal-up">
          <div className="flex items-center gap-4">
            <span className="gallery-divider" />
            <p className="gallery-eyebrow">
              {content.subtitle} · {BRAND_EST}
            </p>
          </div>

          <h1 className="gallery-title text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] max-w-4xl">
            {content.title.split(" ").map((word, i, arr) => {
              const start = Math.floor(arr.length / 3);
              const end = Math.floor((arr.length * 2) / 3);
              const isItalic = i >= start && i < end;
              return (
                <span
                  key={i}
                  className={isItalic ? "italic text-champagne/95" : ""}
                >
                  {word}{" "}
                </span>
              );
            })}
          </h1>

          <p className="text-ivory/75 text-base sm:text-lg max-w-xl leading-relaxed font-light">
            {content.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link to={content.cta_link || "/collections"} className="btn-gallery group">
              {content.cta_text || "Enter the gallery"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/spotlight" className="btn-gallery-ghost group">
              <Sparkles className="mr-2 h-4 w-4" />
              This season's spotlight
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-4 sm:right-10 z-10 hidden md:flex items-center gap-3 font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/45">
        <span>On view</span>
        <span className="h-px w-8 bg-champagne/40" />
        <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
      </div>
    </section>
  );
};

export default HeroSection;
