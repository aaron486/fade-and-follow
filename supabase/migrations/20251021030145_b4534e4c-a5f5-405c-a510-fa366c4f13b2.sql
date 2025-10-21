-- Add 'public' to chat_type enum in a separate transaction
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public' AND enumtypid = 'public.chat_type'::regtype) THEN
    ALTER TYPE public.chat_type ADD VALUE 'public';
  END IF;
END $$;