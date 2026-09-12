-- ============================================================
-- Supabase GRANT Fix — Run this in the SQL Editor
-- Fixes "permission denied for table" errors for the anon role
-- ============================================================

-- Grant read access to anonymous users
GRANT SELECT ON public.alerts TO anon;
GRANT SELECT ON public.public_messages TO anon;
GRANT SELECT ON public.crowd_markers TO anon;
GRANT SELECT ON public.user_keys TO anon;

-- Grant insert access to authenticated users
GRANT INSERT ON public.alerts TO authenticated;
GRANT INSERT ON public.public_messages TO authenticated;
GRANT INSERT ON public.crowd_markers TO authenticated;
GRANT INSERT, UPDATE ON public.user_keys TO authenticated;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
