import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Eye,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/use-admin-access";

const ArtistsAdmin = () => {
  const [artists, setArtists] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { checkAdminAccess } = useAdminAccess();

  useEffect(() => {
    fetchArtists();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = artists.filter(
      (a) =>
        a.name?.toLowerCase().includes(term) ||
        a.nationality?.toLowerCase().includes(term) ||
        a.style?.toLowerCase().includes(term)
    );
    setFiltered(result);
  }, [artists, searchTerm]);

  const fetchArtists = async () => {
    try {
      setIsLoading(true);
      const data = await db.getArtists();
      const withCount = await Promise.all(
        (data || []).map(async (artist) => {
          try {
            const works = await db.getArtworksByArtist(artist.id);
            return { ...artist, artworkCount: works.length };
          } catch {
            return { ...artist, artworkCount: 0 };
          }
        })
      );
      setArtists(withCount);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast({
        title: "Could not load",
        description: "Failed to fetch artists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!checkAdminAccess()) return;
    if (!confirm(`Remove "${name}" from the roster? This cannot be undone.`)) {
      return;
    }
    try {
      await db.deleteArtist(id);
      setArtists(artists.filter((a) => a.id !== id));
      toast({ title: "Removed", description: `"${name}" was deleted.` });
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast({
        title: "Could not delete",
        description: "Please try again.",
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
            <p className="gallery-eyebrow">— Loading roster</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
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
            <p className="gallery-eyebrow mb-4">— The roster</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
              Artists
            </h1>
            <p className="font-display italic text-champagne text-lg sm:text-xl mt-2">
              The voices on view.
            </p>
          </div>
          <Link to="/admin/artists/new" className="btn-gallery self-start sm:self-end">
            <Plus className="h-4 w-4 mr-2" />
            Welcome new artist
          </Link>
        </header>

        {/* Filter */}
        <div className="border-y border-border py-5 mb-10 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search artists, nationality, style..."
              className="w-full pl-10 pr-3 py-2.5 bg-transparent border border-border text-ivory placeholder:text-muted-foreground/60 font-mono text-xs tracking-[0.16em] uppercase focus:outline-none focus:border-champagne/60 transition-colors"
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground shrink-0">
            {filtered.length} {filtered.length === 1 ? "artist" : "artists"}
          </span>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="border border-border bg-card p-14 text-center">
            <User className="h-7 w-7 text-muted-foreground mx-auto mb-5" />
            <p className="gallery-eyebrow mb-3">— Empty roster</p>
            <h2 className="font-display text-3xl text-ivory mb-3">
              {searchTerm ? "Nothing matches" : "No artists yet"}
            </h2>
            <p className="text-muted-foreground font-light mb-7 max-w-md mx-auto">
              {searchTerm
                ? "Try a different search term."
                : "Welcome the first artist to begin the roster."}
            </p>
            {!searchTerm && (
              <Link to="/admin/artists/new" className="btn-gallery">
                <Plus className="h-4 w-4 mr-2" />
                Add first artist
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-12">
            {filtered.map((artist, idx) => (
              <article
                key={artist.id}
                className="border border-border bg-card hover:border-champagne/50 transition-smooth group"
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-secondary border-b border-border">
                  {artist.profile_image_url ? (
                    <img
                      src={artist.profile_image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover transition-slow group-hover:scale-105"
                      style={{ filter: "grayscale(0.25) saturate(0.9)" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-9 w-9 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <span className="gallery-plate">
                      № {String(idx + 1).padStart(3, "0")}
                    </span>
                  </div>
                  {artist.is_featured && (
                    <div className="absolute right-3 top-3">
                      <span className="font-mono text-[9px] tracking-[0.28em] uppercase bg-champagne text-warmblack px-2 py-1">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <h2 className="font-display text-2xl text-ivory leading-tight">
                    {artist.name}
                  </h2>
                  <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.28em] uppercase">
                    <span className="text-muted-foreground">
                      {artist.nationality || "—"}
                    </span>
                    <span className="text-champagne">
                      {artist.artworkCount} {artist.artworkCount === 1 ? "work" : "works"}
                    </span>
                  </div>
                  {artist.style && (
                    <p className="font-display italic text-sm text-muted-foreground">
                      {artist.style}
                    </p>
                  )}
                  {artist.bio && (
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 font-light">
                      {artist.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-1 pt-3 border-t border-border">
                    <Link
                      to={`/admin/artists/${artist.id}/edit`}
                      className="flex-1 font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/70 hover:text-champagne text-center py-2 transition-colors"
                    >
                      <Edit className="inline h-3 w-3 mr-1.5" />
                      Edit
                    </Link>
                    <Link
                      to="/artists"
                      className="flex-1 font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/70 hover:text-champagne text-center py-2 transition-colors"
                    >
                      <Eye className="inline h-3 w-3 mr-1.5" />
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(artist.id, artist.name)}
                      className="flex-1 font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/70 hover:text-terracotta text-center py-2 transition-colors"
                    >
                      <Trash2 className="inline h-3 w-3 mr-1.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtistsAdmin;
