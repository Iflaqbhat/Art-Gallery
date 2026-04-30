import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/supabase";
import AdminNavbar from "@/components/ui/admin-navbar";
import { useToast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/use-admin-access";
import {
  Mail,
  Loader2,
  Trash2,
  ExternalLink,
  Search,
  Inbox,
  Clock,
  CheckCheck,
} from "lucide-react";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
];

const InquiriesAdmin = () => {
  const { toast } = useToast();
  const { requireAdminAccess } = useAdminAccess();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    try {
      requireAdminAccess();
    } catch {
      /* hook handles redirect */
    }
  }, [requireAdminAccess]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await db.listInquiries();
      setItems(data || []);
    } catch (err) {
      toast({
        title: "Could not load",
        description: err.message || "Failed to fetch inquiries.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let rows = [...items];
    if (filter !== "all") rows = rows.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.buyer_name || "").toLowerCase().includes(q) ||
          (r.buyer_email || "").toLowerCase().includes(q) ||
          (r.message || "").toLowerCase().includes(q) ||
          (r.artwork?.title || "").toLowerCase().includes(q) ||
          (r.collection?.title || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [items, filter, search]);

  const counts = useMemo(() => {
    const out = { all: items.length };
    for (const s of STATUSES) out[s.value] = 0;
    items.forEach((i) => {
      if (out[i.status] !== undefined) out[i.status] += 1;
    });
    return out;
  }, [items]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await db.updateInquiry(id, { status });
      setItems((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status } : row))
      );
      toast({ title: "Updated", description: `Marked as ${status}.` });
    } catch (err) {
      toast({
        title: "Could not update",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      await db.deleteInquiry(confirmDelete.id);
      setItems((prev) => prev.filter((row) => row.id !== confirmDelete.id));
      setConfirmDelete(null);
      toast({ title: "Removed", description: "Inquiry deleted." });
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSubject = (row) => {
    if (row.kind === "collection" && row.collection) {
      return (
        <Link
          to={`/collection/${row.collection.id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 font-display italic text-champagne hover:text-ivory transition-colors"
        >
          {row.collection.title}
          <ExternalLink className="h-3 w-3" />
        </Link>
      );
    }
    if (row.kind === "artwork" && row.artwork) {
      return (
        <Link
          to={`/artwork/${row.artwork.id}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 font-display italic text-champagne hover:text-ivory transition-colors"
        >
          {row.artwork.title}
          <ExternalLink className="h-3 w-3" />
        </Link>
      );
    }
    return (
      <span className="font-display italic text-muted-foreground">
        {row.kind === "collection" ? "Collection" : "Artwork"} (removed)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="gallery-eyebrow mb-4">— Curator panel</p>
            <h1 className="font-display text-5xl sm:text-6xl text-ivory leading-tight tracking-tight">
              Inquiries
            </h1>
            <p className="font-display italic text-champagne text-xl sm:text-2xl mt-2">
              {items.length} {items.length === 1 ? "note" : "notes"} from collectors.
            </p>
          </div>
          <button onClick={load} className="btn-gallery-ghost">
            Refresh
          </button>
        </header>

        {/* Status tabs */}
        <div className="border-y border-border py-4 mb-10 flex flex-wrap gap-1 items-center font-mono text-[11px] tracking-[0.28em] uppercase">
          {[{ value: "all", label: "All" }, ...STATUSES].map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-4 py-2 transition-colors ${
                filter === s.value
                  ? "text-champagne border-b border-champagne"
                  : "text-ivory/60 hover:text-ivory border-b border-transparent"
              }`}
            >
              {s.label}
              <span className="ml-2 text-muted-foreground">
                {counts[s.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-10 relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, message, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border text-ivory placeholder:text-muted-foreground/50 pl-11 pr-4 py-3 focus:outline-none focus:border-champagne/60 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-6 w-6 text-champagne mx-auto mb-5 animate-spin" />
              <p className="gallery-eyebrow">— Loading inquiries</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-border bg-card p-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-5" />
            <p className="font-display italic text-2xl text-ivory mb-3">
              {search || filter !== "all"
                ? "Nothing matches that filter."
                : "No inquiries yet."}
            </p>
            <p className="text-muted-foreground text-sm font-light max-w-md mx-auto">
              When a visitor sends an inquiry on an artwork or collection, it
              will appear here. We'll also forward a copy to your inbox if
              Web3Forms is configured.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((row) => (
              <article
                key={row.id}
                className="border border-border bg-card p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start"
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`gallery-plate ${
                        row.status === "new"
                          ? "text-champagne border-champagne/50"
                          : ""
                      }`}
                    >
                      {row.kind === "collection" ? "Whole room" : "Single work"}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                    {row.option_label && (
                      <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
                        · {row.option_label}
                      </span>
                    )}
                    {typeof row.quoted_price === "number" && row.quoted_price > 0 && (
                      <span className="font-display text-base text-champagne">
                        ${row.quoted_price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-2xl text-ivory leading-tight break-words">
                    {row.buyer_name || "Anonymous collector"}{" "}
                    <span className="text-muted-foreground font-display italic text-base">
                      · about {renderSubject(row)}
                    </span>
                  </h2>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <a
                      href={`mailto:${row.buyer_email}?subject=Re: your inquiry on Maison Aman`}
                      className="inline-flex items-center gap-1.5 text-champagne hover:text-ivory transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {row.buyer_email}
                    </a>
                    {row.buyer_phone && (
                      <span className="text-muted-foreground">{row.buyer_phone}</span>
                    )}
                  </div>

                  {row.message && (
                    <p className="text-ivory/85 leading-relaxed font-light whitespace-pre-line border-l-2 border-champagne/40 pl-4 mt-3">
                      {row.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-2 items-stretch lg:items-end shrink-0">
                  <select
                    value={row.status}
                    disabled={updating === row.id}
                    onChange={(e) => updateStatus(row.id, e.target.value)}
                    className="font-mono text-[10px] tracking-[0.24em] uppercase bg-background border border-border text-ivory px-3 py-2 focus:outline-none focus:border-champagne/60"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  {row.status !== "replied" && (
                    <button
                      onClick={() => updateStatus(row.id, "replied")}
                      disabled={updating === row.id}
                      className="inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase border border-border bg-background px-3 py-2 text-champagne hover:border-champagne/60 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                      Mark replied
                    </button>
                  )}

                  <button
                    onClick={() => setConfirmDelete(row)}
                    className="inline-flex items-center justify-center font-mono text-[10px] tracking-[0.28em] uppercase border border-border bg-background px-3 py-2 text-terracotta hover:border-terracotta/60 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

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
              Remove this inquiry?
            </h2>
            <p className="text-muted-foreground text-sm font-light leading-relaxed mb-6">
              The note from{" "}
              <span className="text-champagne font-display italic">
                {confirmDelete.buyer_name || confirmDelete.buyer_email}
              </span>{" "}
              will be deleted permanently. (Your inbox copy is unaffected.)
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

export default InquiriesAdmin;
