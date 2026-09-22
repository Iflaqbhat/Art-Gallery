CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE NOT NULL,
  email text UNIQUE,
  name text NOT NULL,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'ceo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, bio text,
  birth_year integer, death_year integer, nationality text, style text,
  website_url text, image_url text, is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  banner_image_url text, audio_url text, bundle_price numeric(12,2),
  is_featured boolean NOT NULL DEFAULT false, display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text,
  year_created integer, medium text, dimensions text, price numeric(12,2),
  image_url text, audio_url text,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false, is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS featured_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, subtitle text,
  description text, image_url text, cta_text text, cta_link text,
  is_active boolean NOT NULL DEFAULT true, display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, artwork_id)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('artwork', 'collection')),
  artwork_id uuid REFERENCES artworks(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  buyer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL, buyer_email text NOT NULL, buyer_phone text, message text,
  option_label text, quoted_price numeric(12,2),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','replied','closed')),
  curator_notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artworks_artist_idx ON artworks(artist_id);
CREATE INDEX IF NOT EXISTS artworks_collection_idx ON artworks(collection_id);
CREATE INDEX IF NOT EXISTS collections_order_idx ON collections(display_order);
CREATE INDEX IF NOT EXISTS inquiries_created_idx ON inquiries(created_at DESC);

DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','artists','collections','artworks','featured_content','inquiries']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = table_name || '_touch') THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', table_name || '_touch', table_name);
    END IF;
  END LOOP;
END $$;
