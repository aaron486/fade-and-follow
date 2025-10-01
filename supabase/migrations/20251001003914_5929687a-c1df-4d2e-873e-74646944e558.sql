-- Fix security issue: Add search_path to function
CREATE OR REPLACE FUNCTION check_direct_chat_members()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;