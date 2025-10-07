-- Create public_bettors table for celebrities and public figures
CREATE TABLE IF NOT EXISTS public.public_bettors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  social_handles jsonb DEFAULT '{}'::jsonb, -- {twitter: "", instagram: ""}
  source_urls text[] DEFAULT '{}', -- URLs to scrape
  is_verified boolean DEFAULT true,
  follower_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create public_picks table for celebrity picks
CREATE TABLE IF NOT EXISTS public.public_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bettor_id uuid NOT NULL REFERENCES public.public_bettors(id) ON DELETE CASCADE,
  sport text NOT NULL,
  event_name text NOT NULL,
  market text NOT NULL,
  selection text NOT NULL,
  odds numeric NOT NULL,
  stake_units numeric DEFAULT 1.0,
  status text NOT NULL DEFAULT 'pending', -- pending, win, loss, push
  confidence text DEFAULT 'medium',
  reasoning text,
  source_url text,
  source_post_id text,
  posted_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create public_bettor_records table for stats tracking
CREATE TABLE IF NOT EXISTS public.public_bettor_records (
  bettor_id uuid PRIMARY KEY REFERENCES public.public_bettors(id) ON DELETE CASCADE,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  pushes integer NOT NULL DEFAULT 0,
  units_won numeric NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_pick_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_bettors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_bettor_records ENABLE ROW LEVEL SECURITY;

-- Policies: Public figures are viewable by everyone
CREATE POLICY "Public bettors are viewable by everyone"
ON public.public_bettors FOR SELECT USING (true);

CREATE POLICY "Public picks are viewable by everyone"
ON public.public_picks FOR SELECT USING (true);

CREATE POLICY "Public records are viewable by everyone"
ON public.public_bettor_records FOR SELECT USING (true);

-- System can insert/update
CREATE POLICY "System can manage public bettors"
ON public.public_bettors FOR ALL USING (true);

CREATE POLICY "System can manage public picks"
ON public.public_picks FOR ALL USING (true);

CREATE POLICY "System can manage public records"
ON public.public_bettor_records FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_public_picks_bettor_id ON public.public_picks(bettor_id);
CREATE INDEX idx_public_picks_status ON public.public_picks(status);
CREATE INDEX idx_public_picks_posted_at ON public.public_picks(posted_at DESC);

-- Triggers
CREATE TRIGGER update_public_bettors_updated_at
  BEFORE UPDATE ON public.public_bettors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_picks_updated_at
  BEFORE UPDATE ON public.public_picks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_bettor_records_updated_at
  BEFORE UPDATE ON public.public_bettor_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update public bettor stats
CREATE OR REPLACE FUNCTION public.update_public_bettor_stats(target_bettor_id uuid)
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
BEGIN
  -- Get basic counts and units
  SELECT 
    COUNT(*) FILTER (WHERE status = 'win'),
    COUNT(*) FILTER (WHERE status = 'loss'), 
    COUNT(*) FILTER (WHERE status = 'push'),
    COALESCE(SUM(
      CASE 
        WHEN status = 'win' AND stake_units IS NOT NULL THEN stake_units * (ABS(odds) / 100.0)
        WHEN status = 'loss' AND stake_units IS NOT NULL THEN -stake_units
        ELSE 0
      END
    ), 0)
  INTO win_count, loss_count, push_count, total_units
  FROM public.public_picks 
  WHERE bettor_id = target_bettor_id AND status IN ('win', 'loss', 'push');
  
  -- Calculate current streak
  SELECT array_agg(status ORDER BY COALESCE(resolved_at, posted_at) DESC)
  INTO last_results
  FROM (
    SELECT status, resolved_at, posted_at
    FROM public.public_picks 
    WHERE bettor_id = target_bettor_id AND status IN ('win', 'loss')
    ORDER BY COALESCE(resolved_at, posted_at) DESC
    LIMIT 50
  ) recent_picks;
  
  -- Calculate streaks
  IF array_length(last_results, 1) > 0 THEN
    current_streak_val := 1;
    streak_type := last_results[1];
    longest_streak_val := 1;
    
    FOR i IN 2..array_length(last_results, 1) LOOP
      IF last_results[i] = streak_type THEN
        current_streak_val := current_streak_val + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
    
    streak_count := 1;
    FOR i IN 2..array_length(last_results, 1) LOOP
      IF last_results[i] = last_results[i-1] THEN
        streak_count := streak_count + 1;
        longest_streak_val := GREATEST(longest_streak_val, streak_count);
      ELSE
        streak_count := 1;
      END IF;
    END LOOP;
    
    IF streak_type = 'loss' THEN
      current_streak_val := -current_streak_val;
    END IF;
  END IF;
  
  -- Get last pick timestamp
  DECLARE
    last_pick TIMESTAMP WITH TIME ZONE;
  BEGIN
    SELECT MAX(posted_at) INTO last_pick
    FROM public.public_picks
    WHERE bettor_id = target_bettor_id;
    
    -- Insert or update records
    INSERT INTO public.public_bettor_records (
      bettor_id, wins, losses, pushes, units_won, 
      current_streak, longest_streak, last_pick_at, updated_at
    )
    VALUES (
      target_bettor_id, win_count, loss_count, push_count, total_units,
      current_streak_val, longest_streak_val, last_pick, now()
    )
    ON CONFLICT (bettor_id) 
    DO UPDATE SET
      wins = EXCLUDED.wins,
      losses = EXCLUDED.losses,
      pushes = EXCLUDED.pushes,
      units_won = EXCLUDED.units_won,
      current_streak = EXCLUDED.current_streak,
      longest_streak = EXCLUDED.longest_streak,
      last_pick_at = EXCLUDED.last_pick_at,
      updated_at = now();
  END;
END;
$$;

-- Trigger to update stats when picks change
CREATE OR REPLACE FUNCTION public.handle_public_pick_result_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    PERFORM public.update_public_bettor_stats(NEW.bettor_id);
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.bettor_id != NEW.bettor_id THEN
    PERFORM public.update_public_bettor_stats(OLD.bettor_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER handle_public_pick_result_change
  AFTER INSERT OR UPDATE ON public.public_picks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_public_pick_result_change();

-- Seed some popular public bettors
INSERT INTO public.public_bettors (username, display_name, avatar_url, bio, social_handles, source_urls) VALUES
('stoolpresidente', 'Dave Portnoy', null, 'El Presidente - Barstool Sports Founder', 
 '{"twitter": "stoolpresidente", "instagram": "stoolpresidente"}'::jsonb,
 ARRAY['https://twitter.com/stoolpresidente']),
('barstoolsports', 'Barstool Sports', null, 'Barstool Sports Official', 
 '{"twitter": "barstoolsports", "instagram": "barstoolsports"}'::jsonb,
 ARRAY['https://twitter.com/barstoolsports']),
('barstoolbigcat', 'Big Cat', null, 'Barstool Sports - PMT', 
 '{"twitter": "barstoolbigcat", "instagram": "barstoolbigcat"}'::jsonb,
 ARRAY['https://twitter.com/barstoolbigcat']),
('BookItWentTrent', 'Trent', null, 'Book It Went Trent - Barstool', 
 '{"twitter": "BookItWentTrent", "instagram": "BookItWentTrent"}'::jsonb,
 ARRAY['https://twitter.com/BookItWentTrent'])
ON CONFLICT (username) DO NOTHING;