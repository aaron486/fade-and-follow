-- Create bet_stories table to store user bet stories
CREATE TABLE IF NOT EXISTS public.bet_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  views_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(bet_id)
);

-- Enable RLS
ALTER TABLE public.bet_stories ENABLE ROW LEVEL SECURITY;

-- Users can view stories from their friends
CREATE POLICY "Users can view friends' stories"
ON public.bet_stories
FOR SELECT
USING (
  -- Own stories
  auth.uid() = user_id 
  OR 
  -- Friends' stories that haven't expired
  (
    expires_at > now() 
    AND public.are_users_friends(auth.uid(), user_id)
  )
);

-- Users can create their own stories
CREATE POLICY "Users can create their own stories"
ON public.bet_stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories"
ON public.bet_stories
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own story views
CREATE POLICY "Users can update story views"
ON public.bet_stories
FOR UPDATE
USING (auth.uid() = user_id OR public.are_users_friends(auth.uid(), user_id));

-- Create indexes for efficient queries
CREATE INDEX idx_bet_stories_user_expires ON public.bet_stories(user_id, expires_at DESC);
CREATE INDEX idx_bet_stories_expires ON public.bet_stories(expires_at);

-- Create function to auto-delete expired stories
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.bet_stories
  WHERE expires_at < now();
END;
$$;