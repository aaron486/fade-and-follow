-- Fix the channels RLS policy to allow authenticated users to create channels
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;

-- Create a more permissive policy for channel creation
CREATE POLICY "Authenticated users can create channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND auth.uid() IS NOT NULL
);

-- Ensure the policy for viewing channels works correctly with the security definer function
DROP POLICY IF EXISTS "Users can view channels they belong to" ON public.channels;

CREATE POLICY "Users can view channels they belong to"
ON public.channels
FOR SELECT
TO authenticated
USING (
  public.is_channel_member(auth.uid(), id)
);