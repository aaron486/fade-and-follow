-- Create security definer functions to prevent infinite recursion in RLS policies

-- Function to check if a user is a member of a channel
CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channel_members
    WHERE channel_id = _channel_id
      AND user_id = _user_id
  )
$$;

-- Function to check if a user is an admin of a channel
CREATE OR REPLACE FUNCTION public.is_channel_admin(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channel_members
    WHERE channel_id = _channel_id
      AND user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Function to check if user is the first member (creator) of a channel
CREATE OR REPLACE FUNCTION public.is_first_channel_member(_channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.channel_members
    WHERE channel_id = _channel_id
  )
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Channel admins can add members" ON public.channel_members;
DROP POLICY IF EXISTS "Channel admins can remove members" ON public.channel_members;
DROP POLICY IF EXISTS "Users can view channel members for channels they belong to" ON public.channel_members;

-- Create new policies using security definer functions
CREATE POLICY "Channel admins can add members"
ON public.channel_members
FOR INSERT
WITH CHECK (
  public.is_channel_admin(auth.uid(), channel_id) 
  OR (public.is_first_channel_member(channel_id) AND role = 'admin')
);

CREATE POLICY "Channel admins can remove members"
ON public.channel_members
FOR DELETE
USING (
  public.is_channel_admin(auth.uid(), channel_id) 
  OR user_id = auth.uid()
);

CREATE POLICY "Users can view channel members for channels they belong to"
ON public.channel_members
FOR SELECT
USING (
  public.is_channel_member(auth.uid(), channel_id)
);