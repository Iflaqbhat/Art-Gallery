/**
 * Maison Aman — inquiry submission helper.
 *
 * Every "Inquire" / "Acquire whole collection" submission flows through here.
 * It does two things, in order, with sensible fallbacks:
 *
 *   1. Insert a row into `public.inquiries` (the system of record). RLS
 *      allows public-insert, so this works whether the visitor is signed in
 *      or anonymous. If this fails, we still try the email forward.
 *
 *   2. Optionally forward a copy to the curator's inbox via Web3Forms.
 *      Web3Forms is a free service (https://web3forms.com) designed for
 *      static-site contact forms — the access key is *meant* to be public
 *      and just identifies which destination email to deliver to.
 *
 *      Set `VITE_WEB3FORMS_KEY` in `frontend/.env` to enable email
 *      forwarding. Without the key, inquiries still land in the database
 *      and admins can read them from `/admin/inquiries`.
 */

import { db } from "./supabase";
import { CURATOR_EMAIL, BRAND_NAME } from "./brand";

export type InquiryKind = "artwork" | "collection";

export interface InquiryInput {
  kind: InquiryKind;
  /** UUID of the artwork being inquired about (when kind === 'artwork'). */
  artwork_id?: string | null;
  /** UUID of the collection being inquired about (when kind === 'collection'). */
  collection_id?: string | null;
  /** Authenticated user id, when known. Optional. */
  buyer_user_id?: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  message?: string | null;
  /** e.g. "Original", "Museum print", "Whole room — 12 works". */
  option_label?: string | null;
  /** Price displayed to the buyer at inquiry time, in dollars. */
  quoted_price?: number | null;
  /** Friendly subject context for email — title of the work or room. */
  subject_title?: string;
  /** Optional artist or curator name to include in the email. */
  subject_subtitle?: string;
}

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

const formatLines = (rows: Array<[string, string | number | null | undefined]>) =>
  rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

/** Best-effort email forward via Web3Forms. Never throws — logs on failure. */
async function forwardToInbox(input: InquiryInput): Promise<boolean> {
  const key = (import.meta.env.VITE_WEB3FORMS_KEY as string | undefined)?.trim();
  if (!key) {
    console.info(
      "[inquiry] VITE_WEB3FORMS_KEY not set — skipping email forward, inquiry saved to DB only."
    );
    return false;
  }

  const subject = `${BRAND_NAME} — ${
    input.kind === "collection" ? "Collection inquiry" : "Artwork inquiry"
  }${input.subject_title ? `: ${input.subject_title}` : ""}`;

  const body = formatLines([
    ["Type", input.kind === "collection" ? "Whole collection" : "Single artwork"],
    ["Subject", input.subject_title],
    ["Subtitle", input.subject_subtitle],
    ["Option", input.option_label],
    [
      "Quoted price",
      input.quoted_price ? `$${input.quoted_price.toLocaleString()}` : "On request",
    ],
    ["", ""],
    ["From", input.buyer_name],
    ["Email", input.buyer_email],
    ["Phone", input.buyer_phone],
    ["", ""],
    ["Message", input.message],
  ]);

  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: key,
        subject,
        from_name: `${BRAND_NAME} Inquiry — ${input.buyer_name}`,
        replyto: input.buyer_email,
        to: CURATOR_EMAIL,
        message: body,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      console.warn("[inquiry] Web3Forms forward failed:", res.status, data);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[inquiry] Web3Forms forward error:", err);
    return false;
  }
}

export interface InquiryResult {
  /** Whether the row was persisted in Supabase. */
  saved: boolean;
  /** Whether a copy was emailed to the curator. */
  emailed: boolean;
  inquiryId?: string;
  /** Surface-able error message when *both* paths failed. */
  error?: string;
}

/** Public entry point — call this from the inquiry modal. */
export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  const result: InquiryResult = { saved: false, emailed: false };

  const dbPayload = {
    kind: input.kind,
    artwork_id: input.artwork_id ?? null,
    collection_id: input.collection_id ?? null,
    buyer_user_id: input.buyer_user_id ?? null,
    buyer_name: input.buyer_name,
    buyer_email: input.buyer_email,
    buyer_phone: input.buyer_phone ?? null,
    message: input.message ?? null,
    option_label: input.option_label ?? null,
    quoted_price: input.quoted_price ?? null,
  };

  try {
    const row = (await db.createInquiry(dbPayload)) as { id?: string };
    result.saved = true;
    if (row?.id) result.inquiryId = row.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[inquiry] DB insert failed:", message);
    result.error = message;
  }

  result.emailed = await forwardToInbox(input);

  // If neither path succeeded, surface a clear error so the UI can show it.
  if (!result.saved && !result.emailed) {
    result.error =
      result.error ||
      "We could not record your inquiry. Please email us directly.";
  }

  return result;
}
