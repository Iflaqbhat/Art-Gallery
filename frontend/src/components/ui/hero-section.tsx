import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { publicDb } from "@/lib/supabase-public";
import { PLACEHOLDER_HERO } from "@/lib/media-placeholders";
import { BRAND_EST } from "@/lib/brand";

interface FeaturedContent {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
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
        (row as { banner_image_url?: string }).banner_image_url;
      return {
        title: String(row.title),
        subtitle: row.subtitle != null ? String(row.subtitle) : "Featured",
        description:
          row.description != null
            ? String(row.description)
            : "A curated room — selected works on view.",
        image_url: raw ? String(raw) : PLACEHOLDER_HERO,
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

  const fallback = useMemo<FeaturedContent>(
    () => ({
      title: "A quiet gallery, curated one room at a time.",
      subtitle: "On view",
      description:
        "Maison Aman is a curated art house — paintings, sculpture, and contemporary works selected with intention. Step into stillness.",
      image_url: PLACEHOLDER_HERO,
    }),
    []
  );

  const content = featured ?? fallback;
  const bg = content.image_url?.trim() || PLACEHOLDER_HERO;

  return (
    <section className="relative w-full overflow-hidden">
      {/* Image — sits behind everything */}
      <div className="absolute inset-0">
        <img
          src={bg}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "saturate(0.85) contrast(1.05)" }}
        />
        {/* Editorial overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-warmblack via-warmblack/85 to-warmblack/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-warmblack via-transparent to-warmblack/40" />
      </div>

      {/* Content frame */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-32 pb-20 sm:pt-44 sm:pb-32 min-h-[88vh] flex flex-col justify-end">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-3 w-32 bg-secondary animate-pulse" />
            <div className="h-16 w-full max-w-3xl bg-secondary/70 animate-pulse" />
            <div className="h-12 w-full max-w-2xl bg-secondary/50 animate-pulse" />
            <div className="h-10 w-40 bg-secondary/50 animate-pulse mt-4" />
          </div>
        ) : (
          <div className="max-w-3xl space-y-7 reveal-up">
            {/* Eyebrow with rule */}
            <div className="flex items-center gap-4">
              <span className="gallery-divider" />
              <p className="gallery-eyebrow">
                {content.subtitle} · {BRAND_EST}
              </p>
            </div>

            {/* Headline */}
            <h1 className="gallery-title text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] max-w-4xl">
              {content.title.split(" ").map((word, i, arr) => {
                // Italicize the middle ~third for that editorial pull-quote feel
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

            {/* Description */}
            <p className="text-ivory/75 text-base sm:text-lg max-w-xl leading-relaxed font-light">
              {content.description}
            </p>

            {/* CTAs */}
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
        )}
      </div>

      {/* Bottom credits strip — museum-tag aesthetic */}
      <div className="absolute bottom-6 right-4 sm:right-10 z-10 hidden md:flex items-center gap-3 font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/45">
        <span>On view</span>
        <span className="h-px w-8 bg-champagne/40" />
        <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
      </div>
    </section>
  );
};

export default HeroSection;
