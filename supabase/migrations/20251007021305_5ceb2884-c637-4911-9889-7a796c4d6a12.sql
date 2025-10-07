-- Fix the update_user_records_stats function to resolve GROUP BY issue
CREATE OR REPLACE FUNCTION public.update_user_records_stats(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Fixed: Remove duplicate ORDER BY clause
  SELECT array_agg(status ORDER BY COALESCE(resolved_at, updated_at) DESC)
  INTO last_results
  FROM (
    SELECT status, resolved_at, updated_at
    FROM public.bets 
    WHERE user_id = target_user_id AND status IN ('win', 'loss')
    ORDER BY COALESCE(resolved_at, updated_at) DESC
    LIMIT 50
  ) recent_bets;
  
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
$function$;