import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "../../lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import { ArtistCombobox } from "@/components/ui/artist-combobox";
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Camera,
  Music,
  Plus,
  Loader2,
} from "lucide-react";

const ArtworkForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  /** When the curator clicks "Add work to this room" from a collection
   *  workspace we pre-select that collection so the dropdown already
   *  reflects the room they were just in. */
  const presetCollectionId = searchParams.get("collection_id");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year_created: "",
    medium: "",
    dimensions: "",
    price: "",
    artist_id: "",
    collection_id: "",
    image_url: "",
    audio_url: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [artists, setArtists] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [artistsData, collectionsData] = await Promise.all([
          db.getArtists(),
          db.getCollections(),
        ]);
        if (cancelled) return;
        setArtists(artistsData || []);
        setCollections(collectionsData || []);

        // New artwork — apply any preset coming from a collection workspace.
        if ((!id || id === "new") && presetCollectionId) {
          setFormData((prev) => ({
            ...prev,
            collection_id: presetCollectionId,
          }));
        }

        if (id && id !== "new") {
          try {
            const artwork = await db.getArtwork(id);
            if (cancelled || !artwork) {
              if (!cancelled) {
                toast({
                  title: "Not found",
                  description: "Returning to the archive.",
                  variant: "destructive",
                });
                navigate("/admin/artworks");
              }
              return;
            }
            setFormData({
              ...artwork,
              tags: artwork.tags?.join(", ") || "",
            });
            setImagePreview(artwork.image_url);
            if (artwork.artist_id) {
              const match = (artistsData || []).find(
                (a) => a.id === artwork.artist_id
              );
              setSelectedArtist(match || null);
            }
          } catch (error) {
            console.error("Error loading artwork:", error);
            toast({
              title: "Could not load",
              description: "Failed to load artwork.",
              variant: "destructive",
            });
            navigate("/admin/artworks");
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Could not load",
          description: "Failed to load supporting data.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, toast, presetCollectionId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file) => {
    try {
      setImagePreview("LOADING");
      const result = await storage.uploadArtworkImage(file);
      if (!result || !result.url) throw new Error("Upload missing URL");
      const imageUrl = result.url;
      handleInputChange("image_url", imageUrl);
      setImagePreview(imageUrl);
      toast({ title: "Uploaded", description: "Image is ready." });
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      setImagePreview(null);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAudioUpload = async (file) => {
    try {
      const result = await storage.uploadArtworkAudio(file);
      if (!result || !result.url) throw new Error("Upload missing URL");
      handleInputChange("audio_url", result.url);
      toast({ title: "Uploaded", description: "Audio guide is ready." });
    } catch (error) {
      console.error("❌ Error uploading audio:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({
        title: "Title and description required",
        description: "Please complete the basics first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const artworkData = {
        title: formData.title,
        description: formData.description,
        year_created: formData.year_created ? parseInt(formData.year_created) : null,
        medium: formData.medium,
        dimensions: formData.dimensions,
        price: formData.price ? parseFloat(formData.price) : null,
        image_url: formData.image_url,
        audio_url: formData.audio_url,
        artist_id: selectedArtist?.id || null,
        collection_id:
          formData.collection_id === "none"
            ? null
            : formData.collection_id || null,
      };

      if (id && id !== "new") {
        await db.updateArtwork(id, artworkData);
        toast({ title: "Updated", description: "Artwork was updated." });
      } else {
        await db.createArtwork(artworkData);
        toast({
          title: "Hung",
          description: "New artwork is on the wall.",
        });
      }

      if (!id || id === "new") {
        if (formData.collection_id && formData.collection_id !== "none") {
          setTimeout(() => navigate("/"), 1200);
        } else {
          navigate("/admin/artworks");
        }
      } else {
        navigate("/admin/artworks");
      }
    } catch (error) {
      console.error("Error saving artwork:", error);
      toast({
        title: "Could not save",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createNewCollection = async (title) => {
    try {
      const newCollection = await db.createCollection({
        title,
        description: `Collection: ${title}`,
        banner_image_url: "",
      });
      setCollections((prev) => [...prev, newCollection]);
      handleInputChange("collection_id", newCollection.id);
      toast({
        title: "Created",
        description: `Collection "${title}" added.`,
      });
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Could not create",
        description: "Failed to create collection.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
            <p className="gallery-eyebrow">— Preparing form</p>
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
          to="/admin/artworks"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to artworks
        </Link>

        <header className="mb-12">
          <p className="gallery-eyebrow mb-4">
            — {id && id !== "new" ? "Editing artwork" : "New artwork"}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
            {id && id !== "new" ? "Edit the piece" : "Hang a new piece"}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Image */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Frame</p>
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-start">
              <div className="relative aspect-[4/5] bg-secondary border border-border overflow-hidden">
                {imagePreview === "LOADING" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-5 w-5 text-champagne mx-auto mb-3 animate-spin" />
                      <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                        Uploading
                      </p>
                    </div>
                  </div>
                ) : imagePreview || formData.image_url ? (
                  <>
                    <img
                      src={imagePreview || formData.image_url}
                      alt="Artwork"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        handleInputChange("image_url", "");
                      }}
                      className="absolute top-2 right-2 h-7 w-7 bg-warmblack/80 border border-ivory/30 text-ivory hover:text-terracotta flex items-center justify-center"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <Camera className="h-7 w-7 text-muted-foreground mb-3" />
                    <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                      No image yet
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-muted-foreground text-sm font-light leading-relaxed">
                  Upload the work's primary image. JPG or PNG, 4:5 portrait orientation looks best in the gallery.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  id="artwork-image"
                  className="sr-only"
                />
                <label
                  htmlFor="artwork-image"
                  className="inline-flex cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-3 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Choose image
                </label>
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
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Untitled, no. 7"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 text-lg font-display focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Description *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="The work's story, technique, and significance..."
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors font-light leading-relaxed resize-y"
                />
              </div>
            </div>
          </section>

          {/* Artist + collection */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Provenance</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Artist
                </label>
                <ArtistCombobox
                  artists={artists}
                  value={selectedArtist?.id || ""}
                  onValueChange={(artistId) => {
                    const artist = artists.find((a) => a.id === artistId);
                    setSelectedArtist(artist);
                    handleInputChange("artist_id", artistId);
                  }}
                  onNewArtist={async (artistName) => {
                    try {
                      const newArtist = await db.createArtist({
                        name: artistName,
                        bio: "",
                        birth_year: null,
                        death_year: null,
                        nationality: "",
                        image_url: "",
                      });
                      setArtists((prev) => [...prev, newArtist]);
                      setSelectedArtist(newArtist);
                      handleInputChange("artist_id", newArtist.id);
                      toast({
                        title: "Welcomed",
                        description: `"${artistName}" is on the roster.`,
                      });
                    } catch (error) {
                      console.error("Error creating artist:", error);
                      toast({
                        title: "Could not create",
                        description: "Failed to add the artist.",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
                    Collection
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const title = prompt("Name the new collection:");
                      if (title) createNewCollection(title);
                    }}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-champagne hover:text-ivory transition-colors"
                  >
                    <Plus className="inline h-3 w-3 mr-1" />
                    New room
                  </button>
                </div>
                <select
                  value={formData.collection_id || "none"}
                  onChange={(e) =>
                    handleInputChange("collection_id", e.target.value)
                  }
                  className="w-full bg-background border border-border text-ivory px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors appearance-none cursor-pointer"
                >
                  <option value="none">— Unassigned</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 mt-2">
                  Linking to a room shows it on the homepage.
                </p>
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Specifications</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year_created}
                  onChange={(e) =>
                    handleInputChange("year_created", e.target.value)
                  }
                  placeholder="2024"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Medium
                </label>
                <input
                  value={formData.medium}
                  onChange={(e) => handleInputChange("medium", e.target.value)}
                  placeholder="Oil on canvas"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Dimensions
                </label>
                <input
                  value={formData.dimensions}
                  onChange={(e) =>
                    handleInputChange("dimensions", e.target.value)
                  }
                  placeholder="60 × 80 cm"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Acquisition price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="1200"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Audio guide */}
          <section className="border border-border bg-card p-6 sm:p-8">
            <p className="gallery-eyebrow mb-5">— Audio guide (optional)</p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                }}
                id="artwork-audio"
                className="sr-only"
              />
              <label
                htmlFor="artwork-audio"
                className="inline-flex cursor-pointer font-mono text-[10px] tracking-[0.32em] uppercase border border-border bg-background px-4 py-3 text-ivory/80 hover:border-champagne/50 hover:text-champagne transition-colors shrink-0"
              >
                <Music className="h-3.5 w-3.5 mr-2" />
                {formData.audio_url ? "Replace audio" : "Upload audio"}
              </label>
              {formData.audio_url ? (
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-champagne mb-2">
                    Currently linked
                  </p>
                  <audio
                    src={formData.audio_url}
                    controls
                    className="w-full"
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm font-light leading-relaxed flex-1">
                  Members will hear this guide on the artwork's page — usually
                  a 60-90 second curatorial reading.
                </p>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link to="/admin/artworks" className="btn-gallery-ghost">
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
                  {id && id !== "new" ? "Save changes" : "Hang on the wall"}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ArtworkForm;
