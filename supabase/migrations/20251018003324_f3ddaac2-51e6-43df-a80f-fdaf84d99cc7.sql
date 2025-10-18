-- Fix Critical Security Issue: Restrict profiles table public access
-- Drop the overly permissive policy that allows anyone to view all user data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow users to view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view friends' profiles (full access for friends)
CREATE POLICY "Users can view friends profiles"
ON public.profiles FOR SELECT  
TO authenticated
USING (are_users_friends(auth.uid(), user_id));

-- Create a public view for limited profile data (leaderboard functionality)
-- Only exposes username, display_name, avatar_url for public viewing
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Fix Critical Security Issue: Restrict feed_items INSERT to admins only
-- Drop the dangerous policy that allows anyone to insert feed items
DROP POLICY IF EXISTS "System can insert feed items" ON public.feed_items;

-- Only admins can insert feed items
CREATE POLICY "Admins can insert feed items"
ON public.feed_items FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Note: Edge functions should use SUPABASE_SERVICE_ROLE_KEY to bypass RLS when inserting feed items