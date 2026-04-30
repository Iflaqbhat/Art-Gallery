/**
 * Reusable inquiry modal — used by both the artwork detail page (single
 * piece) and the collection detail page (whole room). Captures buyer
 * details, hands the rest off to `submitInquiry`.
 */
import React, { useEffect, useState } from "react";
import { Loader2, X, Check } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { submitInquiry, type InquiryKind } from "@/lib/inquiry";
import { useToast } from "@/hooks/use-toast";

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
  kind: InquiryKind;
  artworkId?: string | null;
  collectionId?: string | null;
  /** Title shown at the top of the modal — e.g. artwork name or room name. */
  subjectTitle: string;
  /** Sub-line shown below the title — e.g. artist name or "Whole room". */
  subjectSubtitle?: string;
  /** Thumbnail shown next to the subject. */
  subjectImage?: string | null;
  /** Selected option label, e.g. "Original" or "Whole room — 12 works". */
  optionLabel?: string | null;
  /** Price quoted at inquiry time. Pass null/undefined for "on request". */
  quotedPrice?: number | null;
}

const InquiryModal: React.FC<InquiryModalProps> = ({
  open,
  onClose,
  kind,
  artworkId,
  collectionId,
  subjectTitle,
  subjectSubtitle,
  subjectImage,
  optionLabel,
  quotedPrice,
}) => {
  type AuthShape = {
    user?: { id?: string; email?: string; name?: string } | null;
    isAuthenticated: boolean;
  };
  const { user, isAuthenticated } = useAuth() as AuthShape;
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Pre-fill from the signed-in user once the modal opens.
  useEffect(() => {
    if (!open) return;
    setDone(false);
    setName((prev) => prev || user?.name || "");
    setEmail((prev) => prev || user?.email || "");
  }, [open, user?.email, user?.name]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast({
        title: "We need name and email",
        description: "So a curator can write back to you.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitInquiry({
        kind,
        artwork_id: artworkId ?? null,
        collection_id: collectionId ?? null,
        buyer_user_id: isAuthenticated && user?.id ? user.id : null,
        buyer_name: name.trim(),
        buyer_email: email.trim(),
        buyer_phone: phone.trim() || null,
        message: message.trim() || null,
        option_label: optionLabel || null,
        quoted_price: quotedPrice ?? null,
        subject_title: subjectTitle,
        subject_subtitle: subjectSubtitle,
      });

      if (!result.saved && !result.emailed) {
        toast({
          title: "Could not send",
          description: result.error || "Please try again or email us directly.",
          variant: "destructive",
        });
        return;
      }

      setDone(true);
      toast({
        title: "Inquiry sent",
        description: result.emailed
          ? "A curator will be in touch within 24 hours."
          : "We've recorded it — a curator will reach out shortly.",
      });
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: (err as Error)?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-warmblack/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border shadow-frame my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="gallery-eyebrow">— Inquiry</p>
            <h2 className="font-display text-2xl text-ivory">
              {kind === "collection" ? "Acquire this room" : "Acquire this work"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-ivory/60 hover:text-ivory"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {done ? (
          <div className="p-10 text-center space-y-4">
            <div className="h-12 w-12 mx-auto border border-champagne/40 bg-champagne/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-champagne" />
            </div>
            <p className="gallery-eyebrow">— On its way</p>
            <h3 className="font-display text-3xl text-ivory">
              Your note has been sent
            </h3>
            <p className="text-muted-foreground font-light leading-relaxed max-w-sm mx-auto">
              A curator will reach out within 24 hours. In the meantime, the
              gallery stays open.
            </p>
            <button onClick={onClose} className="btn-gallery-ghost">
              Continue browsing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Subject card */}
            <div className="flex items-center gap-4 border border-border p-3 bg-background">
              {subjectImage && (
                <img
                  src={subjectImage}
                  alt=""
                  className="w-16 h-16 object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-ivory truncate">
                  {subjectTitle}
                </p>
                {subjectSubtitle && (
                  <p className="font-display italic text-sm text-muted-foreground truncate">
                    {subjectSubtitle}
                  </p>
                )}
                {optionLabel && (
                  <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground/80 mt-1">
                    {optionLabel}
                  </p>
                )}
              </div>
              {typeof quotedPrice === "number" && (
                <span className="font-display text-xl text-champagne whitespace-nowrap">
                  ${quotedPrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Your name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-3 py-2 text-sm focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-3 py-2 text-sm focus:outline-none focus:border-champagne/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                Phone (optional)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-3 py-2 text-sm focus:outline-none focus:border-champagne/60 transition-colors"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-2 block">
                A note for the curator
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  kind === "collection"
                    ? "Tell us what drew you to this room — installation plans, viewing requests, anything we should know."
                    : "Tell us what drew you to this piece — viewing, framing, shipping, anything we should know."
                }
                className="w-full bg-background border border-border text-ivory placeholder:text-muted-foreground/40 px-3 py-2 text-sm focus:outline-none focus:border-champagne/60 transition-colors resize-y leading-relaxed font-light"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gallery w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send inquiry"
              )}
            </button>

            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground/70 text-center">
              No payment now — a curator confirms availability first.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default InquiryModal;
