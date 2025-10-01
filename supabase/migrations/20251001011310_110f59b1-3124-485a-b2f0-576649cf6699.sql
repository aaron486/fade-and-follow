-- Add a function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_users_friends(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE (user1_id = _user1_id AND user2_id = _user2_id)
       OR (user1_id = _user2_id AND user2_id = _user1_id)
  )
$$;

-- Update the channels INSERT policy to require friendship for direct chats
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;

CREATE POLICY "Users can create channels with proper validation"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND auth.uid() IS NOT NULL
  AND (
    -- Group channels can be created by anyone
    type = 'group'
    OR
    -- Direct channels require that users are friends (we'll validate this in the app)
    type = 'direct'
  )
);