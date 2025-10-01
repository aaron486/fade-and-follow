-- Fix the channel_members INSERT policy to allow channel creators to add initial members
DROP POLICY IF EXISTS "Channel admins can add members" ON public.channel_members;

-- Create a function to check if user is the channel creator
CREATE OR REPLACE FUNCTION public.is_channel_creator(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channels
    WHERE id = _channel_id
      AND created_by = _user_id
  )
$$;

-- New policy that allows channel creators and admins to add members
CREATE POLICY "Channel creators and admins can add members"
ON public.channel_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is the channel creator
  public.is_channel_creator(auth.uid(), channel_id)
  -- OR user is already an admin of the channel
  OR public.is_channel_admin(auth.uid(), channel_id)
  -- OR this is the first member being added and they're being made admin
  OR (public.is_first_channel_member(channel_id) AND role = 'admin')
);