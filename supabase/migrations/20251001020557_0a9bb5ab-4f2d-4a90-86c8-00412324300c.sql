-- Force PostgREST schema cache reload by sending a notification
NOTIFY pgrst, 'reload schema';

-- Verify the policy by recreating it with explicit configuration
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;

CREATE POLICY "Users can create channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
);