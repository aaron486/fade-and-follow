-- Revert profiles RLS policies to original state
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friends profiles" ON public.profiles;
DROP VIEW IF EXISTS public.public_profiles;

-- Restore original permissive profile viewing policy
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Revert feed_items RLS policies
DROP POLICY IF EXISTS "Only admins can insert feed items" ON public.feed_items;

-- Restore original feed_items insert policy
CREATE POLICY "Anyone can insert feed items" 
ON public.feed_items 
FOR INSERT 
WITH CHECK (true);