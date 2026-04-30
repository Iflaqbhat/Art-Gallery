import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Grid3X3,
  List,
  Loader2,
  ImageOff,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ArtworksAdmin = () => {
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const { toast } = useToast();

  useEffect(() => {
    fetchArtworks();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = artworks.filter(
      (artwork) =>
        artwork.title?.toLowerCase().includes(term) ||
        artwork.artists?.name?.toLowerCase().includes(term) ||
        artwork.medium?.toLowerCase().includes(term)
    );
    setFilteredArtworks(filtered);
  }, [artworks, searchTerm]);

  const fetchArtworks = async () => {
    try {
      setIsLoading(true);
      const data = await db.getArtworks();
      setArtworks(data || []);
    } catch (error) {
      console.error("Error fetching artworks:", error);
      toast({
        title: "Could not load",
        description: "Failed to fetch artworks.",
        variant: "destructive",
      });
      setArtworks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (
      !confirm(
        `Remove "${title}" from the archive? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await db.deleteArtwork(id);
      setArtworks(artworks.filter((a) => a.id !== id));
      toast({ title: "Removed", description: `"${title}" was deleted.` });
    } catch (error) {
      console.error("Error deleting artwork:", error);
      toast({
        title: "Could not delete",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
            <p className="gallery-eyebrow">— Fetching the archive</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        {/* Back link */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to overview
        </Link>

        {/* Header */}
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="gallery-eyebrow mb-4">— The archive</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
              Artworks
            </h1>
            <p className="font-display italic text-champagne text-lg sm:text-xl mt-2">
              Every piece on the walls.
            </p>
          </div>
          <Link to="/admin/artworks/new" className="btn-gallery self-start sm:self-end">
            <Plus className="h-4 w-4 mr-2" />
            Hang new piece
          </Link>
        </header>

        {/* Filter row */}
        <div className="border-y border-border py-5 mb-10 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, artist, medium..."
              className="w-full pl-10 pr-3 py-2.5 bg-transparent border border-border text-ivory placeholder:text-muted-foreground/60 font-mono text-xs tracking-[0.16em] uppercase focus:outline-none focus:border-champagne/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
              {filteredArtworks.length}{" "}
              {filteredArtworks.length === 1 ? "work" : "works"}
            </span>
            <div className="flex border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-champagne text-warmblack"
                    : "text-ivory/60 hover:text-champagne"
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-champagne text-warmblack"
                    : "text-ivory/60 hover:text-champagne"
                }`}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid view */}
        {filteredArtworks.length === 0 ? (
          <div className="border border-border bg-card p-14 text-center">
            <ImageOff className="h-7 w-7 text-muted-foreground mx-auto mb-5" />
            <p className="gallery-eyebrow mb-3">— Empty walls</p>
            <h2 className="font-display text-3xl text-ivory mb-3">
              {searchTerm ? "Nothing matches" : "No artworks yet"}
            </h2>
            <p className="text-muted-foreground font-light mb-7 max-w-md mx-auto">
              {searchTerm
                ? "Try a different search term."
                : "Hang the first piece on the wall to begin the archive."}
            </p>
            {!searchTerm && (
              <Link to="/admin/artworks/new" className="btn-gallery">
                <Plus className="h-4 w-4 mr-2" />
                Add first artwork
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-7 gap-y-12">
            {filteredArtworks.map((artwork, idx) => (
              <article key={artwork.id} className="group">
                <div className="relative overflow-hidden bg-secondary aspect-[4/5] mb-4 border border-border group-hover:border-champagne/50 transition-smooth">
                  {artwork.image_url ? (
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover transition-slow group-hover:scale-105"
                      style={{ filter: "saturate(0.92)" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Plate */}
                  <div className="absolute left-3 top-3">
                    <span className="gallery-plate">
                      № {String(idx + 1).padStart(3, "0")}
                    </span>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-warmblack via-warmblack/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/artwork/${artwork.id}`}
                        title="Preview"
                        className="h-9 w-9 border border-ivory/30 bg-warmblack/80 backdrop-blur-sm text-ivory hover:text-champagne hover:border-champagne flex items-center justify-center transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        to={`/admin/artworks/${artwork.id}/edit`}
                        title="Edit"
                        className="h-9 w-9 border border-ivory/30 bg-warmblack/80 backdrop-blur-sm text-ivory hover:text-champagne hover:border-champagne flex items-center justify-center transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(artwork.id, artwork.title)}
                        title="Delete"
                        className="h-9 w-9 border border-ivory/30 bg-warmblack/80 backdrop-blur-sm text-ivory hover:text-terracotta hover:border-terracotta flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-1 space-y-1">
                  <h3 className="font-display text-xl text-ivory leading-tight line-clamp-1">
                    {artwork.title}
                  </h3>
                  <p className="font-display italic text-sm text-muted-foreground">
                    by {artwork.artists?.name || "Anonymous"}
                  </p>
                  <div className="flex items-center justify-between pt-2 font-mono text-[10px] tracking-[0.28em] uppercase">
                    <span className="text-muted-foreground">
                      {artwork.year_created || "Undated"}
                    </span>
                    <span className="text-champagne">{formatPrice(artwork.price)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="border border-border bg-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground w-20">
                    Image
                  </th>
                  <th className="text-left p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                    Artist
                  </th>
                  <th className="text-left p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                    Year
                  </th>
                  <th className="text-left p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                    Medium
                  </th>
                  <th className="text-left p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                    Price
                  </th>
                  <th className="text-right p-4 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredArtworks.map((artwork) => (
                  <tr key={artwork.id} className="border-b border-border/60 hover:bg-secondary/40 transition-colors">
                    <td className="p-4">
                      <div className="h-14 w-14 bg-secondary border border-border overflow-hidden">
                        {artwork.image_url ? (
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-display text-lg text-ivory">
                      {artwork.title}
                    </td>
                    <td className="p-4 font-display italic text-muted-foreground">
                      {artwork.artists?.name || "—"}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {artwork.year_created || "—"}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {artwork.medium || "—"}
                    </td>
                    <td className="p-4 font-mono text-sm text-champagne">
                      {formatPrice(artwork.price)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          to={`/artwork/${artwork.id}`}
                          className="h-8 w-8 text-ivory/60 hover:text-champagne flex items-center justify-center transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          to={`/admin/artworks/${artwork.id}/edit`}
                          className="h-8 w-8 text-ivory/60 hover:text-champagne flex items-center justify-center transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(artwork.id, artwork.title)}
                          className="h-8 w-8 text-ivory/60 hover:text-terracotta flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtworksAdmin;
