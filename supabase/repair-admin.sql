-- ─────────────────────────────────────────────────────────────────────────────
--  Canvaso — admin/profile repair
--
--  Run this once if:
--    • You re-ran schema.sql, which dropped public.users, but you already had
--      auth users from before.
--    • Or you're seeing "Banner could not be saved … admin permissions"
--      / "permission denied" errors when uploading from the admin panel.
--
--  WHAT IT DOES (safe to re-run, idempotent)
--    1. Back-fills public.users for every auth.users row that is missing one.
--    2. Promotes your account(s) to role='admin'.
--
--  HOW TO RUN
--    Supabase → SQL Editor → paste this file → Run.
-- ─────────────────────────────────────────────────────────────────────────────

-- 0. Make sure self-insert policy exists (for client-side back-fill flows).
DROP POLICY IF EXISTS users_self_insert ON public.users;
CREATE POLICY users_self_insert ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 1. Back-fill missing profile rows from auth.users.
INSERT INTO public.users (id, email, name, avatar_url, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))   AS name,
  au.raw_user_meta_data->>'avatar_url'                                     AS avatar_url,
  'user'::text                                                              AS role
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

-- 2. Promote known admin email(s) to admin role.
UPDATE public.users
   SET role = 'admin'
 WHERE email IN ('admin@amanarts.com', 'iflaqkhurshid@gmail.com');

-- 3. If still nobody is admin (e.g. you sign in with a different email),
--    promote the very first signed-up user.
UPDATE public.users
   SET role = 'admin'
 WHERE id = (
   SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1
 )
 AND NOT EXISTS (
   SELECT 1 FROM public.users WHERE role IN ('admin', 'ceo')
 );

-- 4. Show the result so you can confirm.
SELECT id, email, name, role, created_at
  FROM public.users
 ORDER BY created_at;
