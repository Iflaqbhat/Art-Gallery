import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, storage } from "../../lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import {
  Users,
  Palette,
  Layers,
  Edit3,
  Save,
  X,
  Plus,
  Upload,
  Loader2,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StatCard = ({ icon: Icon, label, value, hint, accent }) => (
  <article className="border border-border bg-card p-6 sm:p-7 transition-smooth hover:border-champagne/40 group">
    <div className="flex items-start justify-between mb-5">
      <div
        className={`h-10 w-10 border border-border flex items-center justify-center ${
          accent ? "text-champagne" : "text-ivory/60"
        } group-hover:border-champagne/50 transition-colors`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-mono text-[9px] tracking-[0.32em] uppercase text-muted-foreground">
        {hint}
      </span>
    </div>
    <p className="font-display text-5xl text-ivory leading-none mb-2">
      {value}
    </p>
    <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
      {label}
    </p>
  </article>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ artworks: 0, artists: 0, collections: 0 });
  const [recent, setRecent] = useState({ artworks: [], artists: [], collections: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [showBannerEditor, setShowBannerEditor] = useState(false);
  const [bannerData, setBannerData] = useState({
    title: "",
    subtitle: "",
    description: "",
    image_url: "",
    cta_text: "",
    cta_link: "",
  });
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [artworks, artists, collections, featured] = await Promise.all([
          db.getArtworks(),
          db.getArtists(),
          db.getCollections(),
          db.getFeaturedContent(),
        ]);

        setStats({
          artworks: artworks?.length || 0,
          artists: artists?.length || 0,
          collections: collections?.length || 0,
        });
        setRecent({
          artworks: artworks?.slice(0, 5) || [],
          artists: artists?.slice(0, 5) || [],
          collections: collections?.slice(0, 5) || [],
        });

        if (featured) {
          setBannerData({
            title: featured.title || "",
            subtitle: featured.subtitle || "",
            description: featured.description || "",
            image_url: featured.image_url || "",
            cta_text: featured.cta_text || "",
            cta_link: featured.cta_link || "",
          });
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
        toast({
          title: "Could not load",
          description: error.message || "Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast]);

  const handleBannerSave = async () => {
    try {
      setIsSavingBanner(true);
      const saved = await db.updateFeaturedContent(bannerData);
      if (saved) {
        setBannerData({
          title: saved.title || "",
          subtitle: saved.subtitle || "",
          description: saved.description || "",
          image_url: saved.image_url || "",
          cta_text: saved.cta_text || "",
          cta_link: saved.cta_link || "",
        });
      }
      toast({
        title: "Banner published",
        description: "The homepage banner has been updated.",
      });
      setShowBannerEditor(false);
    } catch (error) {
      console.error("Error saving banner:", error);
      toast({
        title: "Could not save banner",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBanner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar onEditBanner={() => setShowBannerEditor(true)} />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
            <p className="gallery-eyebrow">— Preparing the panel</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar onEditBanner={() => setShowBannerEditor(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12 sm:mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="gallery-eyebrow mb-4">— Curator panel</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
              Back of house
            </h1>
            <p className="font-display italic text-champagne text-xl sm:text-2xl mt-2">
              Curate the rooms.
            </p>
          </div>
          <button
            onClick={() => setShowBannerEditor(true)}
            className="btn-gallery-ghost self-start sm:self-end"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit homepage banner
          </button>
        </header>

        {/* Real stats — only what we actually count */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <StatCard
            icon={Palette}
            label="Artworks"
            value={stats.artworks}
            hint="In archive"
            accent
          />
          <StatCard
            icon={Layers}
            label="Collections"
            value={stats.collections}
            hint="Curated rooms"
          />
          <StatCard
            icon={Users}
            label="Artists"
            value={stats.artists}
            hint="In residence"
          />
        </section>

        {/* Quick actions */}
        <section className="mb-16">
          <p className="gallery-eyebrow mb-6">— Curator's tools</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/artworks/new"
              className="border border-border bg-card p-7 hover:border-champagne/50 transition-smooth group"
            >
              <Palette className="h-5 w-5 text-champagne mb-5" />
              <h3 className="font-display text-2xl text-ivory mb-1 group-hover:text-champagne transition-colors">
                New artwork
              </h3>
              <p className="text-muted-foreground text-sm font-light">
                Hang a piece on the wall.
              </p>
              <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground/60 mt-5 group-hover:text-champagne transition-colors">
                Begin →
              </p>
            </Link>
            <Link
              to="/admin/artists/new"
              className="border border-border bg-card p-7 hover:border-champagne/50 transition-smooth group"
            >
              <Users className="h-5 w-5 text-champagne mb-5" />
              <h3 className="font-display text-2xl text-ivory mb-1 group-hover:text-champagne transition-colors">
                New artist
              </h3>
              <p className="text-muted-foreground text-sm font-light">
                Welcome a new voice.
              </p>
              <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground/60 mt-5 group-hover:text-champagne transition-colors">
                Begin →
              </p>
            </Link>
            <Link
              to="/admin/collections"
              className="border border-border bg-card p-7 hover:border-champagne/50 transition-smooth group"
            >
              <Layers className="h-5 w-5 text-champagne mb-5" />
              <h3 className="font-display text-2xl text-ivory mb-1 group-hover:text-champagne transition-colors">
                Curate rooms
              </h3>
              <p className="text-muted-foreground text-sm font-light">
                Open new rooms, set banners, audio, and pricing.
              </p>
              <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground/60 mt-5 group-hover:text-champagne transition-colors">
                Open →
              </p>
            </Link>
            <Link
              to="/admin/inquiries"
              className="border border-border bg-card p-7 hover:border-champagne/50 transition-smooth group"
            >
              <Mail className="h-5 w-5 text-champagne mb-5" />
              <h3 className="font-display text-2xl text-ivory mb-1 group-hover:text-champagne transition-colors">
                Read inquiries
              </h3>
              <p className="text-muted-foreground text-sm font-light">
                Notes from collectors about works and whole rooms.
              </p>
              <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground/60 mt-5 group-hover:text-champagne transition-colors">
                Open →
              </p>
            </Link>
          </div>
        </section>

        {/* Recent activity */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent artworks */}
          <article className="border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="gallery-eyebrow">— Recently hung</p>
                <h2 className="font-display text-2xl text-ivory">
                  Latest artworks
                </h2>
              </div>
              <Link
                to="/admin/artworks"
                className="font-mono text-[10px] tracking-[0.32em] uppercase text-champagne hover:text-ivory transition-colors"
              >
                View all
              </Link>
            </header>
            <div className="p-6 space-y-1">
              {recent.artworks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-display italic text-muted-foreground mb-4">
                    No artworks yet — start the archive.
                  </p>
                  <Link to="/admin/artworks/new" className="btn-gallery-ghost">
                    <Plus className="h-4 w-4 mr-2" />
                    Add first artwork
                  </Link>
                </div>
              ) : (
                recent.artworks.map((art, idx) => (
                  <Link
                    key={art.id}
                    to={`/admin/artworks/${art.id}/edit`}
                    className="flex items-center gap-4 border border-transparent hover:border-border hover:bg-secondary/40 px-3 py-3 transition-colors group"
                  >
                    <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground w-8">
                      № {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg text-ivory truncate group-hover:text-champagne transition-colors">
                        {art.title}
                      </p>
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                        {new Date(art.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>

          {/* Recent artists */}
          <article className="border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="gallery-eyebrow">— New voices</p>
                <h2 className="font-display text-2xl text-ivory">
                  Artists in residence
                </h2>
              </div>
              <Link
                to="/admin/artists"
                className="font-mono text-[10px] tracking-[0.32em] uppercase text-champagne hover:text-ivory transition-colors"
              >
                View all
              </Link>
            </header>
            <div className="p-6 space-y-1">
              {recent.artists.length === 0 ? (
                <div className="text-center py-10">
                  <p className="font-display italic text-muted-foreground mb-4">
                    No artists yet — invite one.
                  </p>
                  <Link to="/admin/artists/new" className="btn-gallery-ghost">
                    <Plus className="h-4 w-4 mr-2" />
                    Add first artist
                  </Link>
                </div>
              ) : (
                recent.artists.map((artist, idx) => (
                  <Link
                    key={artist.id}
                    to={`/admin/artists/${artist.id}/edit`}
                    className="flex items-center gap-4 border border-transparent hover:border-border hover:bg-secondary/40 px-3 py-3 transition-colors group"
                  >
                    <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground w-8">
                      № {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg text-ivory truncate group-hover:text-champagne transition-colors">
                        {artist.name}
                      </p>
                      {artist.nationality && (
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                          {artist.nationality}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>
        </section>
      </main>

      {/* Banner editor modal */}
      {showBannerEditor && (
        <div
          className="fixed inset-0 bg-warmblack/85 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={() => setShowBannerEditor(false)}
        >
          <div className="min-h-screen flex items-start justify-center p-4 py-12">
            <div
              className="w-full max-w-5xl bg-card border border-border shadow-frame"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center justify-between border-b border-border px-6 sm:px-8 py-5">
                <div>
                  <p className="gallery-eyebrow">— Front-of-house</p>
                  <h2 className="font-display text-2xl text-ivory">
                    Edit homepage banner
                  </h2>
                </div>
                <button
                  onClick={() => setShowBannerEditor(false)}
                  className="text-ivory/60 hover:text-ivory transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="p-6 sm:p-8 grid grid-cols-1 xl:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto">
                {/* Form */}
                <div className="space-y-5">
                  <div>
                    <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                      Banner title
                    </label>
                    <input
                      value={bannerData.title}
                      onChange={(e) =>
                        setBannerData({ ...bannerData, title: e.target.value })
                      }
                      placeholder="A quiet gallery, curated one room at a time."
                      className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                      Subtitle / Eyebrow
                    </label>
                    <input
                      value={bannerData.subtitle}
                      onChange={(e) =>
                        setBannerData({ ...bannerData, subtitle: e.target.value })
                      }
                      placeholder="On view"
                      className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={bannerData.description}
                      onChange={(e) =>
                        setBannerData({
                          ...bannerData,
                          description: e.target.value,
                        })
                      }
                      placeholder="A short note about this season's selection..."
                      className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                      Banner image
                    </label>
                    <div className="border border-dashed border-border p-6 text-center mb-3 hover:border-champagne/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-xs mb-3 font-light">
                        Upload an image, or paste a URL below
                      </p>
                      <input
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp"
                        onChange={async (e) => {
                          // Capture refs early — React will null `currentTarget`
                          // after the first await when the synthetic event is
                          // recycled.
                          const inputEl = e.currentTarget;
                          const file = inputEl.files?.[0];
                          if (!file) return;
                          try {
                            const result = await storage.uploadBannerImage(
                              file,
                              "hero"
                            );
                            setBannerData((prev) => ({
                              ...prev,
                              image_url: result.url,
                            }));
                            toast({
                              title: "Image uploaded",
                              description: "Save the banner to publish.",
                            });
                          } catch (err) {
                            toast({
                              title: "Upload failed",
                              description:
                                err?.message ||
                                "Check storage policies on the artwork-images bucket.",
                              variant: "destructive",
                            });
                          } finally {
                            if (inputEl) inputEl.value = "";
                          }
                        }}
                        className="sr-only"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="inline-flex cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-2 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors"
                      >
                        Choose image
                      </label>
                    </div>
                    <input
                      value={bannerData.image_url}
                      onChange={(e) =>
                        setBannerData({
                          ...bannerData,
                          image_url: e.target.value,
                        })
                      }
                      placeholder="https://example.com/image.jpg"
                      className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                        CTA text
                      </label>
                      <input
                        value={bannerData.cta_text}
                        onChange={(e) =>
                          setBannerData({
                            ...bannerData,
                            cta_text: e.target.value,
                          })
                        }
                        placeholder="Enter the gallery"
                        className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                        CTA link
                      </label>
                      <input
                        value={bannerData.cta_link}
                        onChange={(e) =>
                          setBannerData({
                            ...bannerData,
                            cta_link: e.target.value,
                          })
                        }
                        placeholder="/collections"
                        className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <p className="gallery-eyebrow">— Preview</p>
                  <div className="border border-border bg-background overflow-hidden">
                    {bannerData.image_url ? (
                      <div className="relative aspect-[16/10] bg-secondary">
                        <img
                          src={bannerData.image_url}
                          alt="Banner preview"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-warmblack via-warmblack/70 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                          {bannerData.subtitle && (
                            <p className="gallery-eyebrow mb-2">
                              — {bannerData.subtitle}
                            </p>
                          )}
                          {bannerData.title && (
                            <h3 className="font-display text-2xl sm:text-4xl text-ivory leading-tight mb-2">
                              {bannerData.title}
                            </h3>
                          )}
                          {bannerData.description && (
                            <p className="text-ivory/80 text-xs sm:text-sm font-light max-w-md line-clamp-2">
                              {bannerData.description}
                            </p>
                          )}
                          {bannerData.cta_text && (
                            <span className="inline-block mt-4 font-mono text-[10px] tracking-[0.32em] uppercase text-champagne">
                              {bannerData.cta_text} →
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/10] flex items-center justify-center bg-secondary text-muted-foreground font-display italic">
                        No image yet
                      </div>
                    )}
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 leading-relaxed">
                    The hero on the homepage will show roughly like this. Save to publish — visitors will see the change immediately.
                  </p>
                </div>
              </div>

              <footer className="flex flex-col sm:flex-row gap-3 justify-end border-t border-border px-6 sm:px-8 py-5">
                <button
                  onClick={() => setShowBannerEditor(false)}
                  className="btn-gallery-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBannerSave}
                  disabled={isSavingBanner}
                  className="btn-gallery disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingBanner ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Publish banner
                    </>
                  )}
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
