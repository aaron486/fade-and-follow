-- Create user_records table
CREATE TABLE public.user_records (
  user_id UUID PRIMARY KEY,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  pushes INTEGER NOT NULL DEFAULT 0,
  units_won NUMERIC NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_records
CREATE POLICY "Users can view their own records" 
ON public.user_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records" 
ON public.user_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" 
ON public.user_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to calculate and update user statistics
CREATE OR REPLACE FUNCTION public.update_user_records_stats(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  win_count INTEGER := 0;
  loss_count INTEGER := 0;
  push_count INTEGER := 0;
  total_units NUMERIC := 0;
  current_streak_val INTEGER := 0;
  longest_streak_val INTEGER := 0;
  streak_type TEXT := 'win';
  streak_count INTEGER := 0;
  last_results TEXT[];
  result_record RECORD;
BEGIN
  -- Get basic counts and units
  SELECT 
    COUNT(*) FILTER (WHERE status = 'win'),
    COUNT(*) FILTER (WHERE status = 'loss'), 
    COUNT(*) FILTER (WHERE status = 'push'),
    COALESCE(SUM(
      CASE 
        WHEN status = 'win' AND units IS NOT NULL THEN units
        WHEN status = 'loss' AND units IS NOT NULL THEN -units
        ELSE 0
      END
    ), 0)
  INTO win_count, loss_count, push_count, total_units
  FROM public.bets 
  WHERE user_id = target_user_id AND status IN ('win', 'loss', 'push');
  
  -- Calculate current streak by getting recent settled bets in chronological order
  SELECT array_agg(status ORDER BY COALESCE(resolved_at, updated_at) DESC)
  INTO last_results
  FROM public.bets 
  WHERE user_id = target_user_id AND status IN ('win', 'loss')
  ORDER BY COALESCE(resolved_at, updated_at) DESC
  LIMIT 50;
  
  -- Calculate current and longest streaks
  IF array_length(last_results, 1) > 0 THEN
    current_streak_val := 1;
    streak_type := last_results[1];
    longest_streak_val := 1;
    
    -- Calculate current streak
    FOR i IN 2..array_length(last_results, 1) LOOP
      IF last_results[i] = streak_type THEN
        current_streak_val := current_streak_val + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
    
    -- Calculate longest streak by checking all consecutive sequences
    streak_count := 1;
    FOR i IN 2..array_length(last_results, 1) LOOP
      IF last_results[i] = last_results[i-1] THEN
        streak_count := streak_count + 1;
        longest_streak_val := GREATEST(longest_streak_val, streak_count);
      ELSE
        streak_count := 1;
      END IF;
    END LOOP;
    
    -- Make current streak negative for losses
    IF streak_type = 'loss' THEN
      current_streak_val := -current_streak_val;
    END IF;
  END IF;
  
  -- Insert or update user_records
  INSERT INTO public.user_records (
    user_id, wins, losses, pushes, units_won, 
    current_streak, longest_streak, updated_at
  )
  VALUES (
    target_user_id, win_count, loss_count, push_count, total_units,
    current_streak_val, longest_streak_val, now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    pushes = EXCLUDED.pushes,
    units_won = EXCLUDED.units_won,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    updated_at = now();
END;
$$;

-- Create trigger function for bet changes
CREATE OR REPLACE FUNCTION public.handle_bet_result_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update stats for the user when bet status changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    PERFORM public.update_user_records_stats(NEW.user_id);
  END IF;
  
  -- If updating and user_id changed, update both users
  IF TG_OP = 'UPDATE' AND OLD.user_id != NEW.user_id THEN
    PERFORM public.update_user_records_stats(OLD.user_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on bets table
CREATE TRIGGER update_user_records_on_bet_change
AFTER INSERT OR UPDATE ON public.bets
FOR EACH ROW
EXECUTE FUNCTION public.handle_bet_result_change();

-- Add trigger for automatic timestamp updates on user_records
CREATE TRIGGER update_user_records_updated_at
BEFORE UPDATE ON public.user_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_records_user_id ON public.user_records(user_id);
CREATE INDEX idx_user_records_units_won ON public.user_records(units_won DESC);
CREATE INDEX idx_user_records_wins ON public.user_records(wins DESC);