import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, storage } from "@/lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import {
  ArrowLeft,
  Upload,
  X,
  User,
  Loader2,
  Save,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/use-admin-access";

const ArtistForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requireAdminAccess } = useAdminAccess();
  const isEdit = Boolean(id && id !== "new");

  useEffect(() => {
    try {
      requireAdminAccess();
    } catch {
      navigate("/");
    }
  }, [requireAdminAccess, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    birth_year: "",
    death_year: "",
    nationality: "",
    style: "",
    website_url: "",
    image_url: "",
    is_featured: false,
  });

  useEffect(() => {
    if (isEdit) fetchArtist();
  }, [id]);

  const fetchArtist = async () => {
    try {
      setIsLoading(true);
      const artist = await db.getArtistById(id);
      if (artist) {
        setFormData({
          name: artist.name || "",
          bio: artist.bio || "",
          birth_year: artist.birth_year || "",
          death_year: artist.death_year || "",
          nationality: artist.nationality || "",
          style: artist.style || "",
          website_url: artist.website_url || "",
          image_url: artist.image_url || "",
          is_featured: artist.is_featured || false,
        });
        if (artist.image_url) setImagePreview(artist.image_url);
      }
    } catch (error) {
      console.error("Error fetching artist:", error);
      toast({
        title: "Could not load",
        description: "Failed to fetch artist details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await storage.uploadBannerImage(file, "artist");
      setImagePreview(result.url);
      setFormData((prev) => ({ ...prev, image_url: result.url }));
      toast({ title: "Uploaded", description: "Portrait is ready." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the artist's name.",
        variant: "destructive",
      });
      return;
    }
    try {
      requireAdminAccess();
    } catch {
      return;
    }

    try {
      setIsSubmitting(true);
      const artistData = {
        ...formData,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null,
        death_year: formData.death_year ? parseInt(formData.death_year) : null,
      };
      if (isEdit) {
        await db.updateArtist(id, artistData);
        toast({ title: "Updated", description: "Artist record was updated." });
      } else {
        await db.createArtist(artistData);
        toast({
          title: "Welcomed",
          description: "New artist added to the roster.",
        });
      }
      navigate("/admin/artists");
    } catch (error) {
      console.error("Error saving artist:", error);
      toast({
        title: "Could not save",
        description: error.message || `Failed to ${isEdit ? "update" : "create"} artist.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
            <p className="gallery-eyebrow">— Loading record</p>
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
          to="/admin/artists"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to roster
        </Link>

        <header className="mb-12">
          <p className="gallery-eyebrow mb-4">
            — {isEdit ? "Editing artist" : "New artist"}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
            {isEdit ? "Edit profile" : "Welcome a new voice"}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Image */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Portrait</p>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-40 h-40 bg-secondary border border-border overflow-hidden shrink-0">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Artist portrait"
                      className="w-full h-full object-cover"
                      style={{ filter: "grayscale(0.2) saturate(0.9)" }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 h-7 w-7 bg-warmblack/80 border border-ivory/30 text-ivory hover:text-terracotta flex items-center justify-center"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-9 w-9 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  id="artist-portrait"
                  className="sr-only"
                />
                <label
                  htmlFor="artist-portrait"
                  className={`inline-flex cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-3 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors ${
                    isUploading ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      Upload portrait
                    </>
                  )}
                </label>
                <p className="text-muted-foreground text-xs font-light leading-relaxed max-w-md">
                  Square portraits work best. The image becomes the artist's
                  card cover on the public roster.
                </p>
              </div>
            </div>
          </section>

          {/* Identity */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Full name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Iflaq Bhat"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Born
                </label>
                <input
                  type="number"
                  value={formData.birth_year}
                  onChange={(e) =>
                    handleInputChange("birth_year", e.target.value)
                  }
                  placeholder="1950"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Died (if applicable)
                </label>
                <input
                  type="number"
                  value={formData.death_year}
                  onChange={(e) =>
                    handleInputChange("death_year", e.target.value)
                  }
                  placeholder="2020"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Nationality
                </label>
                <input
                  value={formData.nationality}
                  onChange={(e) =>
                    handleInputChange("nationality", e.target.value)
                  }
                  placeholder="Indian, French, ..."
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Style / movement
                </label>
                <input
                  value={formData.style}
                  onChange={(e) => handleInputChange("style", e.target.value)}
                  placeholder="Impressionist, Abstract..."
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) =>
                    handleInputChange("website_url", e.target.value)
                  }
                  placeholder="https://"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Bio + featured */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— The voice</p>
            <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
              Biography
            </label>
            <textarea
              rows={6}
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="A short narrative about the artist's practice..."
              className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors font-light leading-relaxed resize-y"
            />

            <label className="flex items-center gap-3 mt-6 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  handleInputChange("is_featured", e.target.checked)
                }
                className="sr-only peer"
              />
              <span className="h-5 w-5 border border-border bg-background flex items-center justify-center peer-checked:border-champagne peer-checked:bg-champagne/10 transition-colors">
                {formData.is_featured && (
                  <Star className="h-3 w-3 fill-champagne text-champagne" />
                )}
              </span>
              <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/80 group-hover:text-ivory transition-colors">
                Feature on the homepage
              </span>
            </label>
          </section>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link to="/admin/artists" className="btn-gallery-ghost">
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
                  {isEdit ? "Save changes" : "Add to roster"}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ArtistForm;
