import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  Share2,
  ShoppingBag,
  ArrowLeft,
  X,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import InquiryModal from "@/components/ui/inquiry-modal";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { publicDb } from "@/lib/supabase-public";
import { toast } from "@/hooks/use-toast";

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  audio_url?: string;
  year_created?: number;
  medium?: string;
  dimensions?: string;
  price?: number;
  artist_id: string;
  collection_id: string;
  artists?: {
    id: string;
    name: string;
    bio?: string;
    image_url?: string;
  };
  collections?: {
    id: string;
    title: string;
  };
}

interface BuyOption {
  id: string;
  type: "original" | "print";
  title: string;
  description: string;
  price: number;
}

const ArtworkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [related, setRelated] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [selected, setSelected] = useState<string>("original");
  const [showInquiry, setShowInquiry] = useState(false);

  const fetchArtwork = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await publicDb.getArtwork(id);
      setArtwork(data as Artwork);

      if (data?.collection_id) {
        const r = await publicDb.getArtworksByCollection(data.collection_id);
        setRelated(
          (r as Artwork[]).filter((a) => a.id !== id).slice(0, 4)
        );
      } else if (data?.artist_id) {
        const r = await publicDb.getArtworksByArtist(data.artist_id);
        setRelated(
          (r as Artwork[]).filter((a) => a.id !== id).slice(0, 4)
        );
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to load artwork",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchArtwork();
  }, [id, fetchArtwork]);

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Members can favorite works.",
        variant: "destructive",
      });
      return;
    }
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Saved to favorites",
      description: artwork?.title,
    });
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const text = `Look at "${artwork?.title}" on Maison Aman`;
      if (navigator.share) {
        await navigator.share({ title: artwork?.title || "Artwork", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Share it with anyone." });
      }
    } catch {
      /* cancelled */
    }
  };

  const buyOptions: BuyOption[] = artwork
    ? [
        {
          id: "original",
          type: "original",
          title: "Original",
          description: "One-of-one with certificate of authenticity",
          price: artwork.price || 1200,
        },
        {
          id: "print",
          type: "print",
          title: "Museum print",
          description: "Archival-grade reproduction on cotton paper",
          price: 100,
        },
      ]
    : [];
  const selectedOpt = buyOptions.find((o) => o.id === selected);

  const handleBuy = () => {
    setShowBuy(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-3 w-32 bg-secondary animate-pulse mb-6" />
          <div className="h-20 w-full max-w-3xl bg-secondary/70 animate-pulse mb-4" />
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-44 text-center px-4">
          <p className="gallery-eyebrow mb-4">— 404</p>
          <h1 className="font-display text-5xl text-ivory mb-6">
            Artwork not found
          </h1>
          <Link to="/collections" className="btn-gallery-ghost">
            Back to collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Two-column editorial layout */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <Link
            to={
              artwork.collection_id
                ? `/collection/${artwork.collection_id}`
                : "/collections"
            }
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-ivory/60 hover:text-champagne transition-colors mb-12"
          >
            <ArrowLeft className="h-3 w-3" />
            {artwork.collections?.title
              ? `Back to ${artwork.collections.title}`
              : "All collections"}
          </Link>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20">
            {/* Image / frame */}
            <div className="relative">
              <div className="relative bg-card border border-border p-3 sm:p-4 shadow-frame">
                <div className="bg-secondary overflow-hidden aspect-[4/5]">
                  <img
                    src={artwork.image_url || "/placeholder.svg"}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                    style={{ filter: "saturate(0.95)" }}
                  />
                </div>
              </div>

              {/* Museum tag */}
              <div className="absolute -bottom-6 left-6 bg-card border border-border px-5 py-3 shadow-frame">
                <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-muted-foreground">
                  № {artwork.id.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Text column */}
            <div className="space-y-8 reveal-up">
              {artwork.collections && (
                <Link
                  to={`/collection/${artwork.collection_id}`}
                  className="inline-block gallery-eyebrow hover:text-ivory transition-colors"
                >
                  — {artwork.collections.title}
                </Link>
              )}

              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-ivory leading-[0.95] tracking-tight">
                {artwork.title}
              </h1>

              {artwork.artists && (
                <p className="font-display italic text-2xl text-champagne">
                  by {artwork.artists.name}
                </p>
              )}

              {artwork.description && (
                <p className="text-ivory/75 leading-relaxed font-light text-base sm:text-lg max-w-xl">
                  {artwork.description}
                </p>
              )}

              {/* Specs (museum tag) */}
              <dl className="grid grid-cols-2 gap-y-4 gap-x-8 border-y border-border py-7">
                {artwork.year_created && (
                  <div>
                    <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1.5">
                      Year
                    </dt>
                    <dd className="font-display text-xl text-ivory">
                      {artwork.year_created}
                    </dd>
                  </div>
                )}
                {artwork.medium && (
                  <div>
                    <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1.5">
                      Medium
                    </dt>
                    <dd className="font-display text-xl text-ivory">
                      {artwork.medium}
                    </dd>
                  </div>
                )}
                {artwork.dimensions && (
                  <div>
                    <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1.5">
                      Dimensions
                    </dt>
                    <dd className="font-display text-xl text-ivory">
                      {artwork.dimensions}
                    </dd>
                  </div>
                )}
                {artwork.price && (
                  <div>
                    <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1.5">
                      Acquisition
                    </dt>
                    <dd className="font-display text-xl text-champagne">
                      ${artwork.price.toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={handleBuy} className="btn-gallery">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Inquire
                </button>
                <button onClick={handleLike} className="btn-gallery-ghost">
                  <Heart
                    className={`mr-2 h-4 w-4 ${
                      isLiked ? "fill-champagne text-champagne" : ""
                    }`}
                  />
                  {isLiked ? "Saved" : "Save"}
                </button>
                <button onClick={handleShare} className="btn-gallery-ghost">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the artist */}
      {artwork.artists && (
        <section className="border-t border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-20">
            <p className="gallery-eyebrow mb-4">— The voice behind the work</p>
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {artwork.artists.image_url && (
                <img
                  src={artwork.artists.image_url}
                  alt={artwork.artists.name}
                  className="w-28 h-28 object-cover border border-border"
                  style={{ filter: "grayscale(0.3) saturate(0.9)" }}
                />
              )}
              <div className="flex-1">
                <h2 className="font-display text-4xl text-ivory mb-4">
                  {artwork.artists.name}
                </h2>
                {artwork.artists.bio ? (
                  <p className="text-muted-foreground leading-relaxed font-light max-w-2xl">
                    {artwork.artists.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic font-display">
                    Part of the Maison Aman collective.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related works */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
          <header className="mb-12">
            <p className="gallery-eyebrow mb-3">— You might also see</p>
            <h2 className="font-display text-3xl sm:text-4xl text-ivory">
              From the same room
            </h2>
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-7">
            {related.map((rel, idx) => (
              <Link
                key={rel.id}
                to={`/artwork/${rel.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4 border border-border group-hover:border-champagne/50 transition-smooth">
                  <img
                    src={rel.image_url || "/placeholder.svg"}
                    alt={rel.title}
                    className="w-full h-full object-cover transition-slow group-hover:scale-105"
                    style={{ filter: "saturate(0.92)" }}
                  />
                  <div className="absolute left-3 top-3">
                    <span className="gallery-plate">
                      № {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-lg text-ivory group-hover:text-champagne transition-colors line-clamp-1">
                  {rel.title}
                </h3>
                {rel.artists && (
                  <p className="font-display italic text-sm text-muted-foreground">
                    by {rel.artists.name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />

      {/* Buy modal */}
      {showBuy && (
        <div
          className="fixed inset-0 bg-warmblack/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowBuy(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border shadow-frame"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="gallery-eyebrow">— Inquiry</p>
                <h2 className="font-display text-2xl text-ivory">
                  Acquire this work
                </h2>
              </div>
              <button
                onClick={() => setShowBuy(false)}
                className="text-ivory/60 hover:text-ivory"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="p-6 space-y-6">
              {/* Thumb */}
              <div className="flex items-center gap-4 border border-border p-3 bg-background">
                <img
                  src={artwork.image_url}
                  alt=""
                  className="w-16 h-16 object-cover"
                />
                <div>
                  <p className="font-display text-xl text-ivory">
                    {artwork.title}
                  </p>
                  <p className="font-display italic text-sm text-muted-foreground">
                    by {artwork.artists?.name || "Anonymous"}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {buyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={`w-full text-left flex items-center justify-between gap-4 p-4 border transition-colors ${
                      selected === opt.id
                        ? "border-champagne bg-secondary/40"
                        : "border-border hover:border-champagne/40"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-display text-lg text-ivory">
                        {opt.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-light">
                        {opt.description}
                      </p>
                    </div>
                    <span className="font-mono text-base text-champagne tracking-wider">
                      ${opt.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-border pt-5">
                <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-muted-foreground">
                  Total
                </span>
                <span className="font-display text-3xl text-champagne">
                  ${selectedOpt?.price.toLocaleString() || 0}
                </span>
              </div>

              <button
                onClick={() => {
                  setShowBuy(false);
                  setShowInquiry(true);
                }}
                className="btn-gallery w-full"
              >
                Continue inquiry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real inquiry modal — captures buyer details, saves to DB,
          forwards via Web3Forms when configured. */}
      <InquiryModal
        open={showInquiry}
        onClose={() => setShowInquiry(false)}
        kind="artwork"
        artworkId={artwork.id}
        subjectTitle={artwork.title}
        subjectSubtitle={
          artwork.artists ? `by ${artwork.artists.name}` : undefined
        }
        subjectImage={artwork.image_url}
        optionLabel={selectedOpt?.title || "Original"}
        quotedPrice={selectedOpt?.price ?? null}
      />
    </div>
  );
};

export default ArtworkDetail;
