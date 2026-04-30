import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Layers,
  Loader2,
  Star,
  Image as ImageIcon,
} from "lucide-react";

const CollectionsAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.getCollections();
      setCollections(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not load",
        description: err.message || "Failed to fetch collections.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [collections, search]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await db.deleteCollection(confirmDelete.id);
      setCollections((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      toast({
        title: "Removed",
        description: `"${confirmDelete.title}" was deleted.`,
      });
      setConfirmDelete(null);
    } catch (err) {
      toast({
        title: "Could not delete",
        description:
          err.message ||
          "Some artworks may still belong to this collection — reassign them first.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="gallery-eyebrow mb-4">— Curator panel</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
              Rooms of the gallery
            </h1>
            <p className="font-display italic text-champagne text-xl sm:text-2xl mt-2">
              {collections.length}{" "}
              {collections.length === 1 ? "collection" : "collections"} on view.
            </p>
          </div>
          <Link to="/admin/collections/new" className="btn-gallery">
            <Plus className="h-4 w-4 mr-2" />
            New collection
          </Link>
        </header>

        {/* Search */}
        <div className="mb-10 relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border text-ivory placeholder:text-muted-foreground/50 pl-11 pr-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
          />
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
              <p className="gallery-eyebrow">— Loading rooms</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-border bg-card p-16 text-center">
            <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-5" />
            <p className="font-display italic text-2xl text-ivory mb-3">
              {search
                ? "Nothing matches that search."
                : "No collections yet — open the first room."}
            </p>
            <p className="text-muted-foreground text-sm font-light mb-7 max-w-md mx-auto">
              Group artworks into curated rooms. Each room gets its own banner,
              description, and homepage placement.
            </p>
            {!search && (
              <Link to="/admin/collections/new" className="btn-gallery">
                <Plus className="h-4 w-4 mr-2" />
                Create first collection
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, idx) => {
              const roomPath = `/admin/collections/${c.id}`;
              const editPath = `/admin/collections/${c.id}/edit`;
              return (
                <article
                  key={c.id}
                  className="border border-border bg-card overflow-hidden group hover:border-champagne/50 transition-smooth flex flex-col"
                >
                  {/* Whole card body navigates into the room workspace.
                      The bottom action row sits outside the link so it can
                      fire its own actions without re-routing. */}
                  <Link
                    to={roomPath}
                    className="block focus:outline-none focus:ring-2 focus:ring-champagne/40"
                    title={`Open "${c.title}"`}
                  >
                    <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                      {c.banner_image_url ? (
                        <img
                          src={c.banner_image_url}
                          alt={c.title}
                          className="w-full h-full object-cover transition-slow group-hover:scale-105"
                          style={{ filter: "saturate(0.92)" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="gallery-plate">
                          Room · {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      {c.is_featured && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 bg-champagne/90 text-warmblack font-mono text-[9px] tracking-[0.32em] uppercase px-2 py-1">
                            <Star className="h-3 w-3 fill-warmblack" />
                            Featured
                          </span>
                        </div>
                      )}
                      {/* Soft "Open the room" hint on hover */}
                      <div className="absolute inset-0 bg-warmblack/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-champagne flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          Open the room
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-display text-2xl text-ivory leading-tight mb-2 line-clamp-1 group-hover:text-champagne transition-colors">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-muted-foreground text-sm font-light leading-relaxed line-clamp-3 mb-4">
                          {c.description}
                        </p>
                      )}
                      <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 px-5 pb-5 pt-4 border-t border-border mt-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(roomPath);
                      }}
                      className="flex-1 inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase text-champagne hover:text-ivory transition-colors py-2"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(editPath);
                      }}
                      className="flex-1 inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/80 hover:text-champagne transition-colors py-2"
                      title="Edit collection details (banner, title, audio, price)"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(c);
                      }}
                      className="flex-1 inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase text-terracotta hover:text-ivory transition-colors py-2"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-warmblack/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isDeleting && setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md bg-card border border-border p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="gallery-eyebrow mb-3">— Confirm</p>
            <h2 className="font-display text-3xl text-ivory leading-tight mb-3">
              Remove this room?
            </h2>
            <p className="text-muted-foreground text-sm font-light leading-relaxed mb-6">
              The collection{" "}
              <span className="text-champagne font-display italic">
                "{confirmDelete.title}"
              </span>{" "}
              will be deleted permanently. Artworks inside will become
              unassigned but won't be deleted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={isDeleting}
                className="btn-gallery-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 font-mono text-[11px] tracking-[0.28em] uppercase bg-terracotta text-ivory hover:bg-terracotta/90 px-5 py-3 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsAdmin;
