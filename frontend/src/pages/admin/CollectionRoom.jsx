/**
 * Admin "Collection Room" workspace.
 *
 * The page an admin lands on when they click on a collection in the admin
 * Collections list. Shows the collection's banner + meta at the top, then
 * every artwork hung in this room with quick edit / remove / delete actions.
 *
 * To change the collection's title, banner, audio, bundle price, etc. the
 * admin clicks the prominent "Edit collection details" button at the top
 * which routes to the existing `CollectionForm` (`/admin/collections/:id/edit`).
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/use-admin-access";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Search,
  Music,
  ExternalLink,
  Star,
  Layers,
  LinkIcon,
} from "lucide-react";

const CollectionRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requireAdminAccess } = useAdminAccess();

  const [collection, setCollection] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    try {
      requireAdminAccess();
    } catch {
      /* hook redirects */
    }
  }, [requireAdminAccess]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, list] = await Promise.all([
        db.getCollection(id),
        db.getArtworksByCollection(id),
      ]);
      if (!c) {
        toast({
          title: "Not found",
          description: "That collection no longer exists.",
          variant: "destructive",
        });
        navigate("/admin/collections");
        return;
      }
      setCollection(c);
      setArtworks(list || []);
    } catch (err) {
      toast({
        title: "Could not load",
        description: err.message || "Failed to load the room.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artworks;
    return artworks.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.medium || "").toLowerCase().includes(q) ||
        (a.artists?.name || "").toLowerCase().includes(q)
    );
  }, [artworks, search]);

  const handleRemoveFromCollection = async (artwork) => {
    setActionId(artwork.id);
    try {
      await db.updateArtwork(artwork.id, { collection_id: null });
      setArtworks((prev) => prev.filter((a) => a.id !== artwork.id));
      toast({
        title: "Unhung",
        description: `"${artwork.title}" was removed from this room (still in the archive).`,
      });
    } catch (err) {
      toast({
        title: "Could not remove",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    try {
      await db.deleteArtwork(confirmDelete.id);
      setArtworks((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      toast({
        title: "Removed",
        description: `"${confirmDelete.title}" was deleted.`,
      });
      setConfirmDelete(null);
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionId(null);
    }
  };

  if (loading || !collection) {
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <Link
          to="/admin/collections"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground hover:text-champagne transition-colors mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to all collections
        </Link>

        {/* Banner + meta */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 mb-14">
          <div className="relative aspect-[16/9] bg-secondary border border-border overflow-hidden">
            {collection.banner_image_url ? (
              <img
                src={collection.banner_image_url}
                alt={collection.title}
                className="w-full h-full object-cover"
                style={{ filter: "saturate(0.92)" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mb-2" />
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase">
                  No banner yet
                </p>
              </div>
            )}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="gallery-plate">
                {artworks.length} {artworks.length === 1 ? "work" : "works"}
              </span>
              {collection.is_featured && (
                <span className="inline-flex items-center gap-1 bg-champagne/90 text-warmblack font-mono text-[9px] tracking-[0.32em] uppercase px-2 py-1">
                  <Star className="h-3 w-3 fill-warmblack" />
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="gallery-eyebrow mb-4">— Curator panel</p>
            <h1 className="font-display text-4xl sm:text-5xl text-ivory leading-[1.05] tracking-tight mb-4">
              {collection.title}
            </h1>
            {collection.description ? (
              <p className="text-muted-foreground leading-relaxed font-light text-sm sm:text-base mb-6">
                {collection.description}
              </p>
            ) : (
              <p className="text-muted-foreground italic font-display mb-6">
                No curatorial note yet.
              </p>
            )}

            {/* Meta plates */}
            <dl className="grid grid-cols-2 gap-4 border-y border-border py-5 mb-6 text-sm">
              <div>
                <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1">
                  Bundle price
                </dt>
                <dd className="font-display text-xl text-champagne">
                  {typeof collection.bundle_price === "number" &&
                  collection.bundle_price > 0
                    ? `$${collection.bundle_price.toLocaleString()}`
                    : "On request"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1">
                  Display order
                </dt>
                <dd className="font-display text-xl text-ivory">
                  {collection.display_order ?? 0}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1">
                  Audio
                </dt>
                <dd className="font-display text-base text-ivory inline-flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-champagne" />
                  {collection.audio_url ? "Attached" : "None"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground mb-1">
                  Visibility
                </dt>
                <dd className="font-display text-base text-ivory">
                  {collection.is_featured ? "On homepage" : "In archive"}
                </dd>
              </div>
            </dl>

            {/* Primary actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/admin/collections/${collection.id}/edit`}
                className="btn-gallery"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit collection details
              </Link>
              <Link
                to={`/admin/artworks/new?collection_id=${collection.id}`}
                className="btn-gallery-ghost"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add work to this room
              </Link>
              <a
                href={`/collection/${collection.id}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-gallery-ghost"
                title="Open public page in a new tab"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View public
              </a>
            </div>
          </div>
        </section>

        {/* Artworks workspace */}
        <section>
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="gallery-eyebrow mb-3">— Hung in this room</p>
              <h2 className="font-display text-3xl sm:text-4xl text-ivory">
                {artworks.length === 0
                  ? "Awaiting hanging"
                  : `${artworks.length} ${
                      artworks.length === 1 ? "piece" : "pieces"
                    }`}
              </h2>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search this room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-card border border-border text-ivory placeholder:text-muted-foreground/50 font-mono text-xs tracking-[0.16em] uppercase focus:outline-none focus:border-champagne/60 transition-colors"
              />
            </div>
          </header>

          {filtered.length === 0 ? (
            <div className="border border-dashed border-border bg-card p-16 text-center">
              <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-5" />
              <p className="font-display italic text-2xl text-ivory mb-3">
                {search
                  ? "Nothing matches that search."
                  : "No works hung in this room yet."}
              </p>
              <p className="text-muted-foreground text-sm font-light max-w-md mx-auto mb-7">
                {search
                  ? "Try a different keyword."
                  : "Hang the first piece — it'll appear here and on the public room page instantly."}
              </p>
              {!search && (
                <Link
                  to={`/admin/artworks/new?collection_id=${collection.id}`}
                  className="btn-gallery"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Hang the first work
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((artwork, idx) => {
                const editPath = `/admin/artworks/${artwork.id}/edit`;
                const isBusy = actionId === artwork.id;
                return (
                  <article
                    key={artwork.id}
                    className="border border-border bg-card overflow-hidden group hover:border-champagne/50 transition-smooth flex flex-col"
                  >
                    <Link
                      to={editPath}
                      className="block focus:outline-none focus:ring-2 focus:ring-champagne/40"
                      title={`Edit "${artwork.title}"`}
                    >
                      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
                        {artwork.image_url ? (
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
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
                            № {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        {artwork.audio_url && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 bg-warmblack/80 border border-champagne/40 text-champagne font-mono text-[9px] tracking-[0.32em] uppercase px-2 py-1">
                              <Music className="h-3 w-3" />
                              Audio
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-warmblack/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-champagne flex items-center gap-2">
                            <Edit3 className="h-3 w-3" />
                            Click to edit
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-display text-xl text-ivory leading-tight line-clamp-1 group-hover:text-champagne transition-colors mb-1">
                          {artwork.title}
                        </h3>
                        {artwork.artists?.name && (
                          <p className="font-display italic text-sm text-muted-foreground line-clamp-1 mb-3">
                            by {artwork.artists.name}
                          </p>
                        )}
                        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.28em] uppercase">
                          <span className="text-muted-foreground">
                            {artwork.year_created || "Undated"}
                          </span>
                          {typeof artwork.price === "number" &&
                            artwork.price > 0 && (
                              <span className="text-champagne">
                                ${artwork.price.toLocaleString()}
                              </span>
                            )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-stretch gap-1 px-3 pb-3 pt-3 border-t border-border mt-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(editPath);
                        }}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase text-champagne hover:text-ivory transition-colors py-2 disabled:opacity-50"
                      >
                        <Edit3 className="h-3 w-3 mr-1.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromCollection(artwork);
                        }}
                        disabled={isBusy}
                        title="Unhang from this room (artwork stays in the archive)"
                        className="flex-1 inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase text-ivory/70 hover:text-champagne transition-colors py-2 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <LinkIcon className="h-3 w-3 mr-1.5" />
                            Unhang
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(artwork);
                        }}
                        disabled={isBusy}
                        className="flex-1 inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase text-terracotta hover:text-ivory transition-colors py-2 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Confirm delete artwork modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-warmblack/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => actionId !== confirmDelete.id && setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md bg-card border border-border p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="gallery-eyebrow mb-3">— Confirm</p>
            <h2 className="font-display text-3xl text-ivory leading-tight mb-3">
              Delete this artwork?
            </h2>
            <p className="text-muted-foreground text-sm font-light leading-relaxed mb-6">
              <span className="text-champagne font-display italic">
                "{confirmDelete.title}"
              </span>{" "}
              will be removed from the gallery permanently. To just take it
              down from this room without losing it, use{" "}
              <span className="text-ivory">Unhang</span> instead.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionId === confirmDelete.id}
                className="btn-gallery-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionId === confirmDelete.id}
                className="flex-1 font-mono text-[11px] tracking-[0.28em] uppercase bg-terracotta text-ivory hover:bg-terracotta/90 px-5 py-3 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
              >
                {actionId === confirmDelete.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete forever
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

export default CollectionRoom;
