-- Add type enum for channels (chats)
CREATE TYPE public.chat_type AS ENUM ('direct', 'group');

-- Add type column to channels table
ALTER TABLE public.channels 
ADD COLUMN type public.chat_type NOT NULL DEFAULT 'group';

-- Create index for better performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels(type);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id_created_at ON public.messages(channel_id, created_at DESC);

-- Add constraint to ensure direct chats have exactly 2 members
CREATE OR REPLACE FUNCTION check_direct_chat_members()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  chat_type public.chat_type;
BEGIN
  -- Get the chat type
  SELECT type INTO chat_type FROM public.channels WHERE id = NEW.channel_id;
  
  -- If it's a direct chat, count members
  IF chat_type = 'direct' THEN
    SELECT COUNT(*) INTO member_count 
    FROM public.channel_members 
    WHERE channel_id = NEW.channel_id;
    
    -- Direct chats must have exactly 2 members
    IF member_count > 2 THEN
      RAISE EXCEPTION 'Direct chats can only have 2 members';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_direct_chat_members ON public.channel_members;
CREATE TRIGGER enforce_direct_chat_members
  BEFORE INSERT ON public.channel_members
  FOR EACH ROW
  EXECUTE FUNCTION check_direct_chat_members();