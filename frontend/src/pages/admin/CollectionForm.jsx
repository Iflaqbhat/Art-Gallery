import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, storage } from "@/lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/use-admin-access";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Star,
  Loader2,
  Image as ImageIcon,
  Music,
  Trash2,
} from "lucide-react";

const CollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requireAdminAccess } = useAdminAccess();
  const isEdit = Boolean(id && id !== "new");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    banner_image_url: "",
    audio_url: "",
    bundle_price: "",
    is_featured: false,
    display_order: 0,
  });

  useEffect(() => {
    try {
      requireAdminAccess();
    } catch {
      navigate("/");
    }
  }, [requireAdminAccess, navigate]);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await db.getCollection(id);
        if (cancelled || !data) return;
        setFormData({
          title: data.title || "",
          description: data.description || "",
          banner_image_url: data.banner_image_url || "",
          audio_url: data.audio_url || "",
          bundle_price:
            typeof data.bundle_price === "number"
              ? String(data.bundle_price)
              : "",
          is_featured: data.is_featured || false,
          display_order: data.display_order || 0,
        });
      } catch (err) {
        toast({
          title: "Could not load",
          description: err.message || "Failed to load collection.",
          variant: "destructive",
        });
        navigate("/admin/collections");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate, toast]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBannerUpload = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await storage.uploadBannerImage(file, "collection");
      handleChange("banner_image_url", result.url);
      toast({ title: "Uploaded", description: "Banner is ready." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (input) input.value = "";
    }
  };

  const handleAudioUpload = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Audio file expected",
        description: "Please choose an MP3, WAV, or M4A file.",
        variant: "destructive",
      });
      if (input) input.value = "";
      return;
    }
    setIsUploadingAudio(true);
    try {
      const result = await storage.uploadCollectionAudio(file, id || "new");
      handleChange("audio_url", result.url);
      toast({ title: "Uploaded", description: "Curator's audio is ready." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAudio(false);
      if (input) input.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Give the collection a title first.",
        variant: "destructive",
      });
      return;
    }
    try {
      requireAdminAccess();
    } catch {
      return;
    }

    setIsSubmitting(true);
    try {
      const bundleRaw = String(formData.bundle_price ?? "").trim();
      const bundleParsed = bundleRaw === "" ? null : parseFloat(bundleRaw);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        banner_image_url: formData.banner_image_url || null,
        audio_url: formData.audio_url || null,
        bundle_price:
          typeof bundleParsed === "number" && !Number.isNaN(bundleParsed)
            ? bundleParsed
            : null,
        is_featured: !!formData.is_featured,
        display_order: parseInt(formData.display_order, 10) || 0,
      };

      if (isEdit) {
        await db.updateCollection(id, payload);
        toast({ title: "Updated", description: "Collection was updated." });
      } else {
        await db.createCollection(payload);
        toast({
          title: "Opened",
          description: "A new room has been added to the gallery.",
        });
      }
      navigate("/admin/collections");
    } catch (err) {
      console.error("Error saving collection:", err);
      toast({
        title: "Could not save",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
            <p className="gallery-eyebrow">— Loading room</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <Link
          to="/admin/collections"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to collections
        </Link>

        <header className="mb-12">
          <p className="gallery-eyebrow mb-4">
            — {isEdit ? "Editing room" : "New room"}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
            {isEdit ? "Edit collection" : "Open a new room"}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Banner */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Banner</p>
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 items-start">
              <div className="relative aspect-[16/9] bg-secondary border border-border overflow-hidden">
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-5 w-5 text-champagne mx-auto mb-3 animate-spin" />
                      <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                        Uploading
                      </p>
                    </div>
                  </div>
                ) : formData.banner_image_url ? (
                  <>
                    <img
                      src={formData.banner_image_url}
                      alt="Banner"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleChange("banner_image_url", "")}
                      className="absolute top-3 right-3 h-8 w-8 bg-warmblack/80 border border-ivory/30 text-ivory hover:text-terracotta flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="h-7 w-7 text-muted-foreground mb-3" />
                    <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                      No banner yet
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-sm font-light leading-relaxed">
                  This banner appears at the top of the room and on the
                  homepage when it's featured. 16:9 ratio renders best.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  id="collection-banner"
                  className="sr-only"
                />
                <label
                  htmlFor="collection-banner"
                  className={`inline-flex cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-3 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors ${
                    isUploading ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Choose banner
                </label>
                <input
                  value={formData.banner_image_url}
                  onChange={(e) =>
                    handleChange("banner_image_url", e.target.value)
                  }
                  placeholder="Or paste an image URL"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-3 py-2 text-xs focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Identity */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Title plate</p>
            <div className="space-y-5">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Title *
                </label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="The North Light Room"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 text-lg font-display focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="A short curatorial note that introduces the room..."
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors font-light leading-relaxed resize-y"
                />
              </div>
            </div>
          </section>

          {/* Curator's audio */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Curator's voice note</p>
            <p className="text-muted-foreground text-sm font-light leading-relaxed mb-5 max-w-2xl">
              Optional. A short audio note that plays at the top of the room
              when visitors arrive. MP3, WAV, or M4A — usually 30–90 seconds.
            </p>

            {formData.audio_url ? (
              <div className="space-y-3">
                <audio
                  controls
                  src={formData.audio_url}
                  className="w-full"
                  preload="none"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("audio_url", "")}
                    className="inline-flex items-center font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-3 text-ivory/80 hover:border-terracotta/60 hover:text-terracotta transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Remove audio
                  </button>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    id="collection-audio-replace"
                    className="sr-only"
                  />
                  <label
                    htmlFor="collection-audio-replace"
                    className={`inline-flex items-center cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-3 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors ${
                      isUploadingAudio ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {isUploadingAudio ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-2" />
                        Replace audio
                      </>
                    )}
                  </label>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border bg-background p-8 flex flex-col items-center text-center">
                <Music className="h-7 w-7 text-muted-foreground mb-3" />
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-4">
                  No audio attached
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  id="collection-audio"
                  className="sr-only"
                />
                <label
                  htmlFor="collection-audio"
                  className={`inline-flex items-center cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-card px-4 py-3 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors ${
                    isUploadingAudio ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {isUploadingAudio ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      Choose audio file
                    </>
                  )}
                </label>
              </div>
            )}
          </section>

          {/* Acquisition */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Acquisition</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Bundle price (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bundle_price}
                  onChange={(e) =>
                    handleChange("bundle_price", e.target.value)
                  }
                  placeholder="Leave empty to use sum of artwork prices"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm font-light leading-relaxed pt-2 sm:pt-9">
                Sets the headline price on the "Acquire the room" CTA. Leave
                empty and we'll quietly fall back to the sum of every priced
                artwork in the collection — or "Price on request" if none.
              </p>
            </div>
          </section>

          {/* Placement */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Placement</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Display order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    handleChange("display_order", e.target.value)
                  }
                  placeholder="0"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 mt-2">
                  Lower numbers appear first on the public page.
                </p>
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Featured
                </label>
                <label className="flex items-center gap-3 cursor-pointer group select-none border border-border bg-background px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) =>
                      handleChange("is_featured", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <span className="h-5 w-5 border border-border bg-secondary flex items-center justify-center peer-checked:border-champagne peer-checked:bg-champagne/10 transition-colors">
                    {formData.is_featured && (
                      <Star className="h-3 w-3 fill-champagne text-champagne" />
                    )}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/80 group-hover:text-ivory transition-colors">
                    Show on homepage
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link to="/admin/collections" className="btn-gallery-ghost">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gallery disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? "Save changes" : "Open the room"}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CollectionForm;
