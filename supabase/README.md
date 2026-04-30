# Maison Aman — Supabase setup

This folder is the source of truth for the database. Everything else (the old
`fix-*.sql` files at the project root) is legacy and can be removed.

## Files

- **`schema.sql`** — drops the existing public tables and re-creates the full
  schema: tables, indexes, triggers, RLS policies, storage buckets and storage
  policies. Safe to re-run.
- **`add-collections-audio-and-inquiries.sql`** — incremental migration that
  adds `collections.audio_url`, `collections.bundle_price`, and the new
  `public.inquiries` table without dropping anything. Safe to re-run. Run
  this once if your project predates the inquiry / audio features.
- **`../scripts/seed-data.js`** — wipes existing artworks/collections/artists
  and inserts a curated demo dataset (4 artists, 5 collections, 14 artworks,
  1 homepage banner). Uses the service-role key.

## First-time setup

1. **Run the schema.**
   - Supabase → SQL Editor → paste `schema.sql` → run.
2. **Make sure you have at least one admin user.**
   - The schema's `handle_new_user()` trigger marks the **first** auth user as
     `admin`, plus anyone signing up with `admin@amanarts.com` or
     `iflaqkhurshid@gmail.com`. Either sign up through the app or run
     `node scripts/set-ceo-role.js`.
3. **Seed sample content.**
   - `cd scripts && cp .env.example .env && fill in the keys`.
   - `npm install && npm run seed`.

## Re-seeding

`seed-data.js` is destructive on the gallery tables only — it deletes every
artwork, collection, artist, and featured-content row before inserting fresh
data. It does **not** touch `auth.users`, `public.users`, or storage objects.

## Repairing your admin account

If you re-run `schema.sql` you will lose your `public.users` rows (they're
dropped along with the gallery tables), but your `auth.users` row stays. The
auto-trigger only re-creates a profile on **new** signups, so your existing
account ends up without a `public.users` row → admin writes start failing
with `permission denied` / `0 rows returned`.

To recover, run **`repair-admin.sql`** once:

1. Supabase → SQL Editor → paste the file → Run.
2. It back-fills profile rows for every existing auth user, and promotes
   `admin@amanarts.com` / `iflaqkhurshid@gmail.com` (and the very first user)
   to `role='admin'`.
3. Sign out and back in so the app picks up your new role.

## Security model (quick reference)

| Table             | Read              | Write                  |
| ----------------- | ----------------- | ---------------------- |
| artists           | public            | admin                  |
| collections       | public            | admin                  |
| artworks          | public            | admin                  |
| featured_content  | public (active)   | admin                  |
| users             | self + admin      | self (limited) / admin |
| user_favorites    | owner             | owner                  |
| inquiries         | admin             | public-insert / admin  |

| Bucket           | Read   | Write |
| ---------------- | ------ | ----- |
| artwork-images   | public | admin |
| artwork-audio    | public | admin (used for both artwork and collection audio) |

`is_admin()` resolves to `true` when `auth.uid()` matches a row in
`public.users` with role in (`admin`, `ceo`).

## Inquiry email forwarding (optional)

Inquiries always land in `public.inquiries` and are visible at
`/admin/inquiries`. To **also** receive a copy in your inbox, set up
[Web3Forms](https://web3forms.com) (free, no card, 250 emails/month):

1. Visit https://web3forms.com → enter your email → they email you an access key.
2. Copy that key into `frontend/.env` as `VITE_WEB3FORMS_KEY=...`.
3. Restart the dev server. Done — every "Inquire" submission now forwards to
   your inbox with the buyer's name, email, message, and the artwork or
   collection in question.

Without the key, the inquiry feature still works — submissions are saved to
the database and admins read them from `/admin/inquiries`.
