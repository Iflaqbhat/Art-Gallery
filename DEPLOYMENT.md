# Maison Aman — Deployment guide

Architecture in one breath:

```
┌─────────────────────────────────────────────┐
│  Browser ── Netlify (static frontend) ───┐  │
│                                          │  │
│                                          ▼  │
│                                ┌──── Supabase ────┐
│                                │  Postgres + RLS  │
│                                │  Auth + Storage  │
│                                └──────────────────┘
│                                          ▲
│                                          │ (admin only,
│                                          │  from your laptop)
│                                ┌─────────┴────────┐
│                                │  scripts/seed-data.js
│                                │  service_role key
│                                └──────────────────┘
```

There is **no Node backend**. Supabase is the backend.

---

## 1. Local development

```bash
cd aman-art/frontend
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

If you also want to seed data or repair admin roles, set up `scripts/.env` separately — see `scripts/.env.example`. The service-role key lives there and **only there**.

---

## 2. Production: Netlify

### 2.1 Connect the repo

- Netlify → "Add new site" → Import from Git → pick your repo.
- Netlify will detect `aman-art/netlify.toml` and use these settings (already in the repo):
  - Base directory: `aman-art/frontend`
  - Build command: `npm run build`
  - Publish directory: `aman-art/frontend/dist`

### 2.2 Environment variables

Site settings → Environment variables → Add a variable.

| Key                       | Value                                           | Required? | Public? |
| ------------------------- | ----------------------------------------------- | --------- | ------- |
| `VITE_SUPABASE_URL`       | `https://YOUR-PROJECT.supabase.co`              | Yes       | Yes¹    |
| `VITE_SUPABASE_ANON_KEY`  | `sb_publishable_...` from Supabase API settings | Yes       | Yes¹    |
| `VITE_WEB3FORMS_KEY`      | Access key from web3forms.com                   | No²       | Yes¹    |

¹ Anything with the `VITE_` prefix is bundled into the public production JS, so it's visible to every visitor. The variables above are *designed* to be public — Row-Level Security on the database protects writes, and the Web3Forms access key is just a routing identifier (not a secret).

² Without `VITE_WEB3FORMS_KEY`, "Inquire" submissions still save to `public.inquiries` and are readable by admins at `/admin/inquiries`. Setting the key only adds a courtesy email forward to your inbox.

### 2.3 What **never** goes on Netlify

- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS. Only used locally by `scripts/seed-data.js`. If it ever leaks, rotate it from the Supabase dashboard.
- Any "admin password" — there is none. The app authenticates admins via Supabase Auth and the `role` column on `public.users` (set by SQL).

### 2.4 Single-page app routing

`netlify.toml` and `public/_redirects` already include the SPA fallback (`/* → /index.html 200`). Without that, hard-loading a deep link like `/admin/inquiries` would 404 from Netlify's static server.

---

## 3. Supabase configuration (one-time)

Done from the Supabase Dashboard for your project:

1. **Auth → URL Configuration**
   - Site URL: `https://YOUR-NETLIFY-DOMAIN`
   - Additional redirect URLs: add `http://localhost:5173` for dev and your Netlify preview domain pattern (`https://*--YOUR-SITE.netlify.app`) so OAuth and password-reset links work everywhere.

2. **Auth → Providers → Email**
   - Turn off "Confirm email" if you want sign-up to log users straight in (the app supports both modes — see `auto-confirm-users.sql`).

3. **Auth → Providers → Google** (optional)
   - Enable if you want Google sign-in. Add the same redirect URLs.

4. **SQL Editor → run `supabase/schema.sql` once** for a fresh project, or `supabase/add-collections-audio-and-inquiries.sql` if you're upgrading an older one.

5. **Promote your account to admin** by running `supabase/repair-admin.sql`, or by signing up first (the `handle_new_user` trigger marks the very first user as admin).

---

## 4. Day-2 operations

| What                          | Where                                            |
| ----------------------------- | ------------------------------------------------ |
| Read inquiries                | `/admin/inquiries`                               |
| Add a collection / artwork    | `/admin/collections` → "New collection"          |
| Edit collection banner/audio  | Click any collection → "Edit collection details" |
| Reseed demo data              | Local: `cd scripts && npm run seed`              |
| Rotate anon key               | Supabase → Settings → API → "Reset anon key" → update Netlify env var → redeploy |
| Rotate service-role key       | Same place, update only `scripts/.env`           |

---

## 5. Going live checklist

- [ ] Supabase project provisioned and `schema.sql` (or migration) run
- [ ] At least one admin in `public.users` (verify with `select email, role from public.users where role='admin';`)
- [ ] Netlify site connected, env vars set, deploy succeeds
- [ ] Site URL + redirect URLs configured in Supabase Auth settings
- [ ] Smoke test: sign up → sign in → admin dashboard → publish banner → public site shows it
- [ ] Smoke test: send an inquiry → it appears at `/admin/inquiries` (and in your inbox if Web3Forms is configured)
