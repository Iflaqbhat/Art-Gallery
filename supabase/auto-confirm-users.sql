-- ─────────────────────────────────────────────────────────────────────────────
--  Aman Art — Confirm any auth users that registered before email confirmation
--  was disabled. Run this AFTER turning off "Confirm email" in:
--      Supabase Dashboard → Authentication → Providers → Email
--  This script:
--      1. Marks every auth.users row with email_confirmed_at = NOW() if it's
--         currently NULL, so they can sign in immediately.
--      2. Reports how many rows were updated, plus a final list of users.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE auth.users
SET    email_confirmed_at = NOW(),
       confirmed_at       = COALESCE(confirmed_at, NOW())
WHERE  email_confirmed_at IS NULL;

-- Sanity check
SELECT id,
       email,
       email_confirmed_at,
       created_at
FROM   auth.users
ORDER  BY created_at DESC;
