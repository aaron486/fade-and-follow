-- Create picks table for user predictions
CREATE TABLE public.picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL,
  event_name TEXT NOT NULL,
  market TEXT NOT NULL,
  selection TEXT NOT NULL,
  odds NUMERIC NOT NULL,
  stake_units NUMERIC NOT NULL DEFAULT 1.0,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'win', 'loss', 'push')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  tails_count INTEGER NOT NULL DEFAULT 0,
  fades_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Users can view public picks and their own picks
CREATE POLICY "Users can view public picks and own picks" 
ON public.picks 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- Users can create their own picks
CREATE POLICY "Users can create their own picks" 
ON public.picks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own picks
CREATE POLICY "Users can update their own picks" 
ON public.picks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own picks
CREATE POLICY "Users can delete their own picks" 
ON public.picks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_picks_updated_at
BEFORE UPDATE ON public.picks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add pick_id to bets table to link tailed/faded picks
ALTER TABLE public.bets 
ADD COLUMN pick_id UUID REFERENCES public.picks(id) ON DELETE SET NULL;

-- Add action type to bets to track if it was a tail or fade
ALTER TABLE public.bets 
ADD COLUMN action_type TEXT CHECK (action_type IN ('tail', 'fade', NULL));