-- Fix security issue: Set search_path for the function
DROP FUNCTION IF EXISTS public.calculate_user_betting_stats(UUID);

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
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;