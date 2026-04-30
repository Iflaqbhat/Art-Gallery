import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Share2, Lock, ArrowLeft, ShoppingBag, Volume2 } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import InquiryModal from "@/components/ui/inquiry-modal";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { db } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface Collection {
  id: string;
  title: string;
  description: string;
  banner_image_url: string;
  audio_url?: string | null;
  bundle_price?: number | null;
  created_at: string;
}

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  audio_url?: string;
  year_created?: number;
  price?: number;
  artist_id: string;
  artists?: { name: string };
}

const CollectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);

  // Total of every priced artwork in the room. Used as the default ask
  // when the curator hasn't set an explicit `bundle_price`.
  const artworksTotal = useMemo(
    () =>
      artworks.reduce(
        (sum, a) => sum + (typeof a.price === "number" ? a.price : 0),
        0
      ),
    [artworks]
  );

  const bundlePrice = useMemo(() => {
    if (!collection) return null;
    if (typeof collection.bundle_price === "number" && collection.bundle_price > 0) {
      return collection.bundle_price;
    }
    return artworksTotal > 0 ? artworksTotal : null;
  }, [collection, artworksTotal]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const collectionData = await db.getCollection(id);
      setCollection(collectionData);
      const artworksData = await db.getArtworksByCollection(id);
      setArtworks(artworksData);
    } catch (error) {
      console.error("Error fetching collection:", error);
      toast({
        title: "Error",
        description: "Failed to load collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: collection?.title || "Collection", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share it with anyone." });
      }
    } catch {
      /* user cancelled */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-44 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-3 w-32 bg-secondary animate-pulse mb-6" />
          <div className="h-20 w-full max-w-3xl bg-secondary/70 animate-pulse mb-4" />
          <div className="h-12 w-full max-w-2xl bg-secondary/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-44 text-center px-4">
          <p className="gallery-eyebrow mb-4">— 404</p>
          <h1 className="font-display text-5xl text-ivory mb-6">
            Collection not found
          </h1>
          <Link to="/collections" className="btn-gallery-ghost">
            Back to all collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <section className="relative h-[80vh] sm:h-[85vh] overflow-hidden">
        <img
          src={collection.banner_image_url || "/placeholder.svg"}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(0.85)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-warmblack via-warmblack/85 to-warmblack/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-warmblack via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-full flex flex-col justify-end pb-16 sm:pb-24">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/60 hover:text-champagne transition-colors mb-8 self-start"
          >
            <ArrowLeft className="h-3 w-3" />
            All collections
          </Link>

          <div className="max-w-3xl space-y-6 reveal-up">
            <div className="flex items-center gap-4">
              <span className="gallery-divider" />
              <p className="gallery-eyebrow">— Curated room</p>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-[88px] text-ivory leading-[0.95] tracking-tight">
              {collection.title}
            </h1>
            {collection.description && (
              <p className="text-ivory/75 text-base sm:text-lg leading-relaxed font-light max-w-2xl">
                {collection.description}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {(bundlePrice || artworks.length > 0) && (
                <button
                  onClick={() => setShowInquiry(true)}
                  className="btn-gallery"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Acquire the room
                </button>
              )}
              <button onClick={handleShare} className="btn-gallery-ghost">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </button>
              <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/50 self-center ml-2">
                {artworks.length} {artworks.length === 1 ? "work" : "works"} on view
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Curator's audio note — only renders if the room has audio. */}
      {collection.audio_url && (
        <section className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-12">
            <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
              <div className="flex items-center gap-3 text-champagne sm:min-w-[200px]">
                <Volume2 className="h-4 w-4" />
                <p className="gallery-eyebrow">— Curator's note</p>
              </div>
              <audio
                controls
                preload="none"
                className="w-full"
                src={collection.audio_url}
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        </section>
      )}

      {/* Visitor invite (if not signed in) */}
      {!isAuthenticated && (
        <section className="border-y border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-16 text-center">
            <Lock className="h-6 w-6 text-champagne mx-auto mb-5" />
            <p className="gallery-eyebrow mb-4">— Become a member</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ivory mb-4">
              Unlock the curator's notes
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 font-light">
              Members hear our voice notes on each work, save favorites, and get
              first access to new rooms.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth/register" className="btn-gallery">
                Become a member
              </Link>
              <Link to="/auth/login" className="btn-gallery-ghost">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Artworks grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
        <header className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="gallery-eyebrow mb-3">— Works in this room</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ivory">
              {artworks.length === 0
                ? "Awaiting hanging"
                : `${artworks.length} ${artworks.length === 1 ? "piece" : "pieces"}`}
            </h2>
          </div>
        </header>

        {artworks.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <p className="font-display italic text-muted-foreground text-xl">
              No works are hanging in this room yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {artworks.map((artwork, idx) => (
              <Link
                key={artwork.id}
                to={`/artwork/${artwork.id}`}
                className="group block"
              >
                <article className="space-y-4">
                  <div className="relative overflow-hidden bg-secondary aspect-[4/5] border border-border group-hover:border-champagne/50 transition-smooth">
                    <img
                      src={artwork.image_url || "/placeholder.svg"}
                      alt={artwork.title}
                      className="w-full h-full object-cover transition-slow group-hover:scale-105"
                      style={{ filter: "saturate(0.92)" }}
                    />
                    <div className="absolute left-3 top-3">
                      <span className="gallery-plate">
                        № {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <div className="px-1 space-y-1">
                    <h3 className="font-display text-xl text-ivory leading-tight group-hover:text-champagne transition-colors line-clamp-1">
                      {artwork.title}
                    </h3>
                    {artwork.artists && (
                      <p className="font-display italic text-muted-foreground text-sm">
                        by {artwork.artists.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 font-mono text-[10px] tracking-[0.28em] uppercase">
                      <span className="text-muted-foreground">
                        {artwork.year_created || "Undated"}
                      </span>
                      {artwork.price && (
                        <span className="text-champagne">
                          ${artwork.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* End-of-room invitation: acquire everything together. */}
        {(bundlePrice || artworks.length > 1) && (
          <div className="mt-20 sm:mt-28 border border-border bg-card p-10 sm:p-14 text-center">
            <p className="gallery-eyebrow mb-4">— Take the whole room</p>
            <h3 className="font-display text-3xl sm:text-5xl text-ivory leading-tight mb-4">
              Acquire {collection.title} as a set
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto font-light leading-relaxed mb-7">
              Some rooms are written as one breath. We can release the entire
              series together — installation notes, certificates, and a
              concierge handover included.
            </p>
            {bundlePrice ? (
              <p className="font-display text-5xl text-champagne mb-2">
                ${bundlePrice.toLocaleString()}
              </p>
            ) : (
              <p className="font-display text-3xl text-champagne mb-2">
                Price on request
              </p>
            )}
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground/80 mb-8">
              {artworks.length} works · single buyer
            </p>
            <button
              onClick={() => setShowInquiry(true)}
              className="btn-gallery"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Inquire for the whole room
            </button>
          </div>
        )}
      </section>

      <Footer />

      <InquiryModal
        open={showInquiry}
        onClose={() => setShowInquiry(false)}
        kind="collection"
        collectionId={collection.id}
        subjectTitle={collection.title}
        subjectSubtitle={`${artworks.length} ${
          artworks.length === 1 ? "work" : "works"
        } · whole room`}
        subjectImage={collection.banner_image_url}
        optionLabel="Whole room"
        quotedPrice={bundlePrice}
      />
    </div>
  );
};

export default CollectionDetail;
