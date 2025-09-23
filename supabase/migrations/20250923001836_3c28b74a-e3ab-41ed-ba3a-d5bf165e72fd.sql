-- Create bets table for tracking user bets
CREATE TABLE public.bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport TEXT NOT NULL,
  event_name TEXT NOT NULL,
  market TEXT NOT NULL, -- ML (Moneyline), Spread, Total, Prop
  selection TEXT NOT NULL, -- What the user picked
  odds DECIMAL(8,2) NOT NULL, -- American odds format (-110, +150, etc)
  stake_units DECIMAL(8,2) NOT NULL DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, win, loss, push
  notes TEXT,
  placed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Create policies for bets
CREATE POLICY "Users can view their own bets" 
ON public.bets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bets" 
ON public.bets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets" 
ON public.bets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bets" 
ON public.bets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_bets_updated_at
BEFORE UPDATE ON public.bets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_bets_user_id ON public.bets(user_id);
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_bets_sport ON public.bets(sport);
CREATE INDEX idx_bets_placed_at ON public.bets(placed_at);

-- Function to calculate user betting stats
CREATE OR REPLACE FUNCTION public.calculate_user_betting_stats(target_user_id UUID)
RETURNS TABLE (
  total_bets INTEGER,
  wins INTEGER,
  losses INTEGER,
  pushes INTEGER,
  win_percentage DECIMAL,
  total_units_wagered DECIMAL,
  total_units_won DECIMAL,
  roi_percentage DECIMAL,
  current_streak INTEGER,
  streak_type TEXT
) AS $$
DECLARE
  win_count INTEGER := 0;
  loss_count INTEGER := 0;
  push_count INTEGER := 0;
  total_count INTEGER := 0;
  units_wagered DECIMAL := 0;
  units_won DECIMAL := 0;
  streak_count INTEGER := 0;
  streak_type_val TEXT := 'none';
  last_results TEXT[];
BEGIN
  -- Get basic counts
  SELECT 
    COUNT(*) FILTER (WHERE status = 'win'),
    COUNT(*) FILTER (WHERE status = 'loss'), 
    COUNT(*) FILTER (WHERE status = 'push'),
    COUNT(*),
    COALESCE(SUM(stake_units), 0)
  INTO win_count, loss_count, push_count, total_count, units_wagered
  FROM public.bets 
  WHERE user_id = target_user_id AND status != 'pending';
  
  -- Calculate units won (simplified - win = stake * odds, loss = -stake)
  SELECT COALESCE(SUM(
    CASE 
      WHEN status = 'win' THEN stake_units * (ABS(odds) / 100.0)
      WHEN status = 'loss' THEN -stake_units
      ELSE 0
    END
  ), 0)
  INTO units_won
  FROM public.bets 
  WHERE user_id = target_user_id AND status != 'pending';
  
  -- Calculate current streak
  SELECT array_agg(status ORDER BY placed_at DESC)
  INTO last_results
  FROM public.bets 
  WHERE user_id = target_user_id AND status IN ('win', 'loss')
  LIMIT 20;
  
  IF array_length(last_results, 1) > 0 THEN
    streak_count := 1;
    streak_type_val := last_results[1];
    
    FOR i IN 2..array_length(last_results, 1) LOOP
      IF last_results[i] = streak_type_val THEN
        streak_count := streak_count + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT 
    total_count,
    win_count,
    loss_count, 
    push_count,
    CASE WHEN (win_count + loss_count) > 0 
         THEN ROUND((win_count::DECIMAL / (win_count + loss_count)) * 100, 2)
         ELSE 0 END,
    units_wagered,
    units_won,
    CASE WHEN units_wagered > 0 
         THEN ROUND((units_won / units_wagered) * 100, 2)
         ELSE 0 END,
    streak_count,
    streak_type_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;