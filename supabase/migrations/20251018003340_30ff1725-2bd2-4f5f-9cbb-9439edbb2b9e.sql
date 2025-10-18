-- Fix the security definer view issue
-- Recreate the public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker=true)
AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  total_bets,
  wins,
  losses,
  current_streak,
  streak_type
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO anon, authenticated;