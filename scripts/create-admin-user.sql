-- Create admin user in auth.users table and public.users table
-- This should be run in the Supabase SQL Editor

-- First, let's create the admin user in auth.users (this is just a demo, normally you'd use Supabase Auth UI)
-- Note: In production, you should use Supabase's built-in auth methods

-- Insert or update admin user in public.users table with CEO role
INSERT INTO public.users (id, name, email, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Admin User',
  'admin@amanart.com',
  'ceo'
) ON CONFLICT (email) DO UPDATE SET
  role = 'ceo',
  name = 'Admin User';

-- Note: You'll need to create the actual auth user through Supabase Auth
-- Go to Authentication > Users in your Supabase dashboard and manually create:
-- Email: admin@amanart.com
-- Password: admin123
-- Then get the UUID and update the query above with the real UUID

-- Alternative: Create the user programmatically (requires service role)
-- This would be done in a backend script, not in SQL Editor