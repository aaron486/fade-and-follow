-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create channels with proper validation" ON public.channels;

-- Create a simpler policy for channel creation
CREATE POLICY "Users can create channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);