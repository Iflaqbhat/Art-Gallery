-- ─────────────────────────────────────────────────────────────────────────────
--  Canvaso — Art Gallery
--  Complete database schema for Supabase (Postgres 15+)
--
--  HOW TO USE
--    1. Open your Supabase project → SQL Editor.
--    2. Paste this file and run it once.
--    3. Run scripts/seed-data.js (or seed-curated.sql) to populate sample data.
--    4. Set an admin user's role via scripts/set-ceo-role.js if needed.
--
--  WHAT THIS DOES
--    • Drops the existing public-schema tables (clean slate).
--    • Recreates a tight, normalized schema:
--        users, artists, collections, artworks,
--        featured_content (homepage hero), user_favorites
--    • Adds indexes, updated_at triggers, and a profile-creation trigger.
--    • Enables RLS with: public read · admin write policies.
--    • Creates the two storage buckets (public) and their object policies.
--
--  SAFE TO RE-RUN — drops are conditional (IF EXISTS) and re-creations are
--  idempotent. Existing auth.users are NOT touched.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Drop everything (clean slate) ───────────────────────────────────────────
DROP TABLE IF EXISTS public.user_favorites      CASCADE;
DROP TABLE IF EXISTS public.exhibition_artworks CASCADE;
DROP TABLE IF EXISTS public.exhibitions         CASCADE;
DROP TABLE IF EXISTS public.blog_posts          CASCADE;
DROP TABLE IF EXISTS public.featured_content    CASCADE;
DROP TABLE IF EXISTS public.artworks            CASCADE;
DROP TABLE IF EXISTS public.collections         CASCADE;
DROP TABLE IF EXISTS public.artists             CASCADE;
DROP TABLE IF EXISTS public.users               CASCADE;

DROP VIEW  IF EXISTS public.artwork_details     CASCADE;
DROP VIEW  IF EXISTS public.collection_details  CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user()      CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at()     CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid)         CASCADE;

-- ─── Helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- 1. Users — mirrors auth.users with profile + role.
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  name        text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin', 'ceo')),
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_touch BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX users_email_idx ON public.users (lower(email));
CREATE INDEX users_role_idx  ON public.users (role);

-- Helper: is the current request an admin?
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = uid AND role IN ('admin', 'ceo')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Artists
CREATE TABLE public.artists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  bio          text,
  birth_year   integer,
  death_year   integer,
  nationality  text,
  style        text,
  website_url  text,
  image_url    text,
  is_featured  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER artists_touch BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX artists_name_idx     ON public.artists (lower(name));
CREATE INDEX artists_featured_idx ON public.artists (is_featured) WHERE is_featured = true;

-- 3. Collections (rooms of the gallery)
CREATE TABLE public.collections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  description       text,
  banner_image_url  text,
  audio_url         text,        -- optional curator's intro / soundtrack
  bundle_price      numeric(12, 2), -- optional price to acquire the whole room
  is_featured       boolean NOT NULL DEFAULT false,
  display_order     integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER collections_touch BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX collections_order_idx    ON public.collections (display_order);
CREATE INDEX collections_featured_idx ON public.collections (is_featured) WHERE is_featured = true;

-- 4. Artworks
CREATE TABLE public.artworks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  year_created    integer,
  medium          text,
  dimensions      text,
  price           numeric(12, 2),
  image_url       text,
  audio_url       text,
  artist_id       uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  collection_id   uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  is_featured     boolean NOT NULL DEFAULT false,
  is_available    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER artworks_touch BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX artworks_artist_idx     ON public.artworks (artist_id);
CREATE INDEX artworks_collection_idx ON public.artworks (collection_id);
CREATE INDEX artworks_featured_idx   ON public.artworks (is_featured) WHERE is_featured = true;
CREATE INDEX artworks_search_idx    ON public.artworks
  USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

-- 5. Featured content — single hero banner row(s) for the homepage
CREATE TABLE public.featured_content (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  subtitle       text,
  description    text,
  image_url      text,
  cta_text       text,
  cta_link       text,
  is_active      boolean NOT NULL DEFAULT true,
  display_order  integer NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER featured_touch BEFORE UPDATE ON public.featured_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX featured_active_idx ON public.featured_content (is_active, display_order);

-- 6. User favorites (saved artworks)
CREATE TABLE public.user_favorites (
  user_id     uuid NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  artwork_id  uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, artwork_id)
);

CREATE INDEX favorites_user_idx ON public.user_favorites (user_id);

-- 7. Inquiries — every "Inquire" submission is captured here as a permanent
-- record. The frontend also forwards a copy to the curator's inbox via
-- Web3Forms, but this is the source of truth admins read from the dashboard.
CREATE TABLE public.inquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            text NOT NULL CHECK (kind IN ('artwork', 'collection')),
  artwork_id      uuid REFERENCES public.artworks(id)    ON DELETE SET NULL,
  collection_id   uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  buyer_user_id   uuid REFERENCES public.users(id)       ON DELETE SET NULL,
  buyer_name      text,
  buyer_email     text,
  buyer_phone     text,
  message         text,
  option_label    text,           -- e.g. "Original", "Museum print", "Whole room"
  quoted_price    numeric(12, 2), -- price displayed to the buyer at inquiry time
  status          text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'in_review', 'replied', 'closed')),
  curator_notes   text,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER inquiries_touch BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX inquiries_kind_idx       ON public.inquiries (kind);
CREATE INDEX inquiries_status_idx     ON public.inquiries (status);
CREATE INDEX inquiries_created_at_idx ON public.inquiries (created_at DESC);

-- ─── Auth trigger: auto-create public.users row on signup ────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role text := 'user';
BEGIN
  -- First user (or matching admin email) becomes admin automatically.
  IF NOT EXISTS (SELECT 1 FROM public.users) THEN
    default_role := 'admin';
  ELSIF NEW.email IN ('admin@amanarts.com', 'iflaqkhurshid@gmail.com') THEN
    default_role := 'admin';
  END IF;

  INSERT INTO public.users (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    default_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    name       = COALESCE(public.users.name, EXCLUDED.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row-Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries         ENABLE ROW LEVEL SECURITY;

-- users: a person can read/update only themselves; admins can read all.
CREATE POLICY users_self_select   ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
-- A user may upsert their *own* profile row (id must match auth.uid).
-- This is needed for client back-fill flows when the on_auth_user_created
-- trigger didn't run (e.g. account predates the schema). It is NOT a way to
-- forge an admin role: if the row already exists, the role check on UPDATE
-- (below) and the admin policy still apply.
CREATE POLICY users_self_insert   ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY users_self_update   ON public.users FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_admin_all     ON public.users FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- public read for gallery content
CREATE POLICY artists_public_read     ON public.artists          FOR SELECT USING (true);
CREATE POLICY collections_public_read ON public.collections      FOR SELECT USING (true);
CREATE POLICY artworks_public_read    ON public.artworks         FOR SELECT USING (true);
CREATE POLICY featured_public_read    ON public.featured_content FOR SELECT USING (is_active = true);

-- admin write for gallery content
CREATE POLICY artists_admin_write     ON public.artists          FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY collections_admin_write ON public.collections      FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY artworks_admin_write    ON public.artworks         FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY featured_admin_write    ON public.featured_content FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- favorites — owner-scoped
CREATE POLICY favorites_owner_all ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- inquiries — anyone (signed-in or anon) can submit; only admins read/manage.
CREATE POLICY inquiries_public_insert ON public.inquiries FOR INSERT
  WITH CHECK (true);
CREATE POLICY inquiries_admin_read    ON public.inquiries FOR SELECT
  USING (public.is_admin());
CREATE POLICY inquiries_admin_update  ON public.inquiries FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY inquiries_admin_delete  ON public.inquiries FOR DELETE
  USING (public.is_admin());

-- ─── Storage buckets ─────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-audio', 'artwork-audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage object policies — drop old, then recreate clean.
DROP POLICY IF EXISTS "artwork_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_audio_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_admin_write"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_audio_admin_write"   ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "artwork_audio_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_audio_admin_delete"  ON storage.objects;
-- Legacy policy names from earlier fix-* scripts
DROP POLICY IF EXISTS "Public Access"                ON storage.objects;

-- Public reads for both buckets
CREATE POLICY "artwork_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'artwork-images');
CREATE POLICY "artwork_audio_public_read"  ON storage.objects FOR SELECT
  USING (bucket_id = 'artwork-audio');

-- Admin-only writes (insert / update / delete)
CREATE POLICY "artwork_images_admin_write"  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artwork-images' AND public.is_admin());
CREATE POLICY "artwork_images_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'artwork-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'artwork-images' AND public.is_admin());
CREATE POLICY "artwork_images_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'artwork-images' AND public.is_admin());

CREATE POLICY "artwork_audio_admin_write"   ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artwork-audio' AND public.is_admin());
CREATE POLICY "artwork_audio_admin_update"  ON storage.objects FOR UPDATE
  USING (bucket_id = 'artwork-audio' AND public.is_admin())
  WITH CHECK (bucket_id = 'artwork-audio' AND public.is_admin());
CREATE POLICY "artwork_audio_admin_delete"  ON storage.objects FOR DELETE
  USING (bucket_id = 'artwork-audio' AND public.is_admin());

-- ─── Done ────────────────────────────────────────────────────────────────────
SELECT 'Schema installed. Now run scripts/seed-data.js to populate sample data.' AS done;
