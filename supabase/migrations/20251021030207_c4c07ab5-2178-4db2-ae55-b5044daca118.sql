-- Add image support to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Add check constraint for message_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_message_type_check'
  ) THEN
    ALTER TABLE public.messages 
    ADD CONSTRAINT messages_message_type_check 
    CHECK (message_type IN ('text', 'image'));
  END IF;
END $$;

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add typing status table for presence
CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'typing_status' AND policyname = 'Users can view typing status in their channels'
  ) THEN
    CREATE POLICY "Users can view typing status in their channels"
    ON public.typing_status FOR SELECT
    USING (is_channel_member(auth.uid(), channel_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'typing_status' AND policyname = 'Users can insert their typing status'
  ) THEN
    CREATE POLICY "Users can insert their typing status"
    ON public.typing_status FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_channel_member(auth.uid(), channel_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'typing_status' AND policyname = 'Users can modify their typing status'
  ) THEN
    CREATE POLICY "Users can modify their typing status"
    ON public.typing_status FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'typing_status' AND policyname = 'Users can remove their typing status'
  ) THEN
    CREATE POLICY "Users can remove their typing status"
    ON public.typing_status FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update RLS for public channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Anyone can view public channels'
  ) THEN
    CREATE POLICY "Anyone can view public channels"
    ON public.channels FOR SELECT
    USING (type = 'public' OR is_channel_member(auth.uid(), id));
  END IF;
END $$;

-- Update channel_members policy
DROP POLICY IF EXISTS "Anyone can join public channels" ON public.channel_members;
DROP POLICY IF EXISTS "Channel creators and admins can add members" ON public.channel_members;

CREATE POLICY "Channel creators and admins can add members"
ON public.channel_members FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.channels 
    WHERE id = channel_id AND type = 'public'
  ) AND user_id = auth.uid())
  OR is_channel_creator(auth.uid(), channel_id) 
  OR is_channel_admin(auth.uid(), channel_id) 
  OR (is_first_channel_member(channel_id) AND role = 'admin')
);

-- Update channels insert policy for public channels
DROP POLICY IF EXISTS "Users can create channels" ON public.channels;
CREATE POLICY "Users can create channels"
ON public.channels FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = created_by AND type != 'public')
  OR (has_role(auth.uid(), 'admin') AND type = 'public')
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_status_channel ON public.typing_status(channel_id, updated_at DESC);