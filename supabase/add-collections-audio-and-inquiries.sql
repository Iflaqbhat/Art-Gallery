-- ─────────────────────────────────────────────────────────────────────────────
--  Canvaso — incremental migration
--  Adds:
--    1. collections.audio_url     — curator's intro audio for each room
--    2. collections.bundle_price  — optional "buy whole collection" price
--    3. public.inquiries table    — captures every "Inquire" submission
--  Safe to re-run; uses IF NOT EXISTS / IF EXISTS guards everywhere.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Collection audio + bundle price
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS audio_url    text,
  ADD COLUMN IF NOT EXISTS bundle_price numeric(12, 2);

-- 2. Inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text NOT NULL CHECK (kind IN ('artwork', 'collection')),
  artwork_id      uuid REFERENCES public.artworks(id)    ON DELETE SET NULL,
  collection_id   uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  buyer_user_id   uuid REFERENCES public.users(id)       ON DELETE SET NULL,
  buyer_name      text,
  buyer_email     text,
  buyer_phone     text,
  message         text,
  option_label    text,
  quoted_price    numeric(12, 2),
  status          text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'in_review', 'replied', 'closed')),
  curator_notes   text,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS inquiries_touch ON public.inquiries;
CREATE TRIGGER inquiries_touch BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS inquiries_kind_idx       ON public.inquiries (kind);
CREATE INDEX IF NOT EXISTS inquiries_status_idx     ON public.inquiries (status);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON public.inquiries (created_at DESC);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist, then recreate cleanly
DROP POLICY IF EXISTS inquiries_public_insert ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin_read    ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin_update  ON public.inquiries;
DROP POLICY IF EXISTS inquiries_admin_delete  ON public.inquiries;

CREATE POLICY inquiries_public_insert ON public.inquiries FOR INSERT
  WITH CHECK (true);
CREATE POLICY inquiries_admin_read    ON public.inquiries FOR SELECT
  USING (public.is_admin());
CREATE POLICY inquiries_admin_update  ON public.inquiries FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY inquiries_admin_delete  ON public.inquiries FOR DELETE
  USING (public.is_admin());

SELECT 'Migration applied: collections.audio_url, collections.bundle_price, inquiries table.' AS done;
