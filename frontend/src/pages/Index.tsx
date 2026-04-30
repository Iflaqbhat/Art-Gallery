import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import HeroSection from "@/components/ui/hero-section";
import ContentRow from "@/components/ui/content-row";
import ArtistProfiles from "@/components/ui/artist-profiles";
import Footer from "@/components/ui/footer";
import { publicDb } from "@/lib/supabase-public";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { PLACEHOLDER_COLLECTIONS } from "@/lib/media-placeholders";
import { BRAND_EST } from "@/lib/brand";

interface Collection {
  id: string;
  title: string;
  description?: string;
  banner_image_url: string;
  created_at: string;
}

const pickBanner = (raw: string | null | undefined, index: number): string => {
  if (typeof raw === "string" && raw.length > 0 && raw !== "/placeholder.svg") {
    return raw;
  }
  return PLACEHOLDER_COLLECTIONS[index % PLACEHOLDER_COLLECTIONS.length];
};

const toRows = (
  list: Collection[],
  start: number,
  max: number
): { id: string; title: string; image: string; year: string }[] =>
  list.slice(start, start + max).map((c, idx) => ({
    id: c.id,
    title: c.title,
    image: pickBanner(c.banner_image_url, start + idx),
    year: String(new Date(c.created_at || Date.now()).getFullYear()),
  }));

const stagger = (
  list: Collection[],
  offset: number,
  max: number
): { id: string; title: string; image: string; year: string }[] => {
  if (!list.length) return [];
  const rotated = [
    ...list.slice(offset % list.length),
    ...list.slice(0, offset % list.length),
  ];
  return rotated.slice(0, max).map((c, idx) => ({
    id: c.id,
    title: c.title,
    image: pickBanner(c.banner_image_url, idx + offset),
    year: String(new Date(c.created_at || Date.now()).getFullYear()),
  }));
};

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const { data: allCollections, isPending, isError, refetch } = useQuery({
    queryKey: ["public", "collections"],
    queryFn: async (): Promise<Collection[]> => {
      const data = await publicDb.getCollections();
      return data ?? [];
    },
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    networkMode: "online",
  });

  const list = useMemo(
    () => (Array.isArray(allCollections) ? allCollections : []),
    [allCollections]
  );

  const sections = useMemo(() => {
    if (!list.length) return { top: [], featured: [], recent: [] };
    const cap = Math.min(16, list.length);
    return {
      top: toRows(list, 0, cap),
      featured: stagger(list, Math.min(3, list.length - 1), cap),
      recent: stagger(list, Math.min(7, list.length - 1), cap),
    };
  }, [list]);

  const firstLoad = isPending && list.length === 0;

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <HeroSection />

      <main className="relative pt-16 sm:pt-24 pb-8">
        {firstLoad && (
          <div className="px-4 sm:px-6 lg:px-10 space-y-4" aria-busy="true">
            <div className="h-8 w-48 bg-secondary animate-pulse" />
            <div className="h-32 w-full max-w-xl bg-secondary/70 animate-pulse" />
          </div>
        )}

        {isError && (
          <div className="mx-4 sm:mx-6 lg:mx-10 mb-12 border border-destructive/30 bg-card p-8 text-center">
            <p className="gallery-eyebrow mb-3">— Notice</p>
            <p className="font-display text-2xl text-ivory mb-4">
              We couldn't reach the gallery archive
            </p>
            <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
              Check your connection and Supabase RLS (anon read on{" "}
              <code className="font-mono text-champagne">collections</code>).
            </p>
            <button onClick={() => refetch()} className="btn-gallery-ghost">
              Try again
            </button>
          </div>
        )}

        {!firstLoad && !isError && list.length === 0 && (
          <div className="px-4 sm:px-6 lg:px-10 mb-16">
            <div className="border border-border bg-card p-10 sm:p-14 text-center max-w-2xl mx-auto">
              <p className="gallery-eyebrow mb-4">— The walls are bare</p>
              <h3 className="font-display text-3xl text-ivory mb-3">
                No collections published yet
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Sign in as the curator and publish your first collection from the admin panel.
              </p>
              <Link to="/admin/secret-login-panel-2024" className="btn-gallery-ghost">
                Curator sign-in
              </Link>
            </div>
          </div>
        )}

        {!firstLoad && !isError && list.length > 0 && (
          <>
            <ContentRow
              title="On view this season"
              caption="The works rotating on our walls right now."
              items={sections.top.length ? sections.top : sections.featured}
              linkType="collection"
              isAuthenticated={isAuthenticated}
            />
            <ContentRow
              title="Curator's room"
              caption="Selections we keep returning to."
              items={sections.featured.length ? sections.featured : sections.top}
              linkType="collection"
              isAuthenticated={isAuthenticated}
            />
            <ContentRow
              title="Recently spotlighted"
              caption="The most recent additions to the archive."
              items={sections.recent.length ? sections.recent : sections.top}
              linkType="collection"
              isAuthenticated={isAuthenticated}
            />
          </>
        )}

        <ArtistProfiles />

        {/* Editorial closing block — pull-quote style */}
        <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <p className="gallery-eyebrow mb-6">
              — From the maison · {BRAND_EST}
            </p>
            <p className="font-display text-3xl sm:text-5xl text-ivory leading-tight">
              <span className="italic text-champagne">"We don't curate</span> for the
              loudest room.
              <br />
              We curate for the quiet
              <span className="italic text-champagne"> moment after."</span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <span className="gallery-divider" />
              <Link
                to="/spotlight"
                className="font-mono text-[11px] tracking-[0.32em] uppercase text-champagne hover:text-ivory transition-colors"
              >
                This season's spotlight →
              </Link>
              <span className="gallery-divider" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
