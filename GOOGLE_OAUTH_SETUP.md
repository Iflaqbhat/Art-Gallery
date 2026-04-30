# Google OAuth Setup Guide (Supabase)

This is optional — Google sign-in is wired up in the app but not required. You
can ship without it.

## 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Enable**
4. Paste your Google OAuth credentials:
   - **Client ID**: `<your-client-id>.apps.googleusercontent.com`
   - **Client Secret**: `<your-client-secret>`

   Get these from
   [Google Cloud Console](https://console.cloud.google.com/) →
   APIs & Services → Credentials → "+ Create Credentials" →
   "OAuth client ID" → Application type "Web application".

> **Never commit these values to git.** They belong only in the Supabase
> dashboard. If you accidentally paste them into a markdown file or env that
> ends up in a public repo, rotate the secret in Google Cloud Console
> immediately.

## 2. Configure Redirect URLs

In the Google OAuth provider settings in Supabase, add this redirect URL
(replace with your project ref):

- `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 3. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Open your OAuth 2.0 client ID
4. Under **Authorized redirect URIs** add:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for local dev)
   - `https://<your-netlify-domain>/auth/callback` (for production)

## 4. Test the flow

1. `npm run dev`
2. Visit `/auth/login`
3. Click **Continue with Google**
4. Complete the OAuth flow — you'll land back in the app, signed in.

## 5. Promote yourself to admin (one-time)

After your first successful Google login:

1. Run `supabase/repair-admin.sql` in the Supabase SQL editor — it back-fills
   your `public.users` row and promotes the configured admin emails to
   `role = 'admin'`.
2. Sign out and back in so the app picks up the role.

## Environment variables

The frontend only reads the Supabase URL and the anon (publishable) key:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-publishable-key>
```

Anything OAuth-related (client secrets) lives in the Supabase dashboard, not
in the frontend.
