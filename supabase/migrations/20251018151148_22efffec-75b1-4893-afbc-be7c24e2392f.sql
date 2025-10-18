-- Create a function to automatically create a bet story when a bet is created
CREATE OR REPLACE FUNCTION public.create_bet_story_for_new_bet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only create a story if one doesn't already exist for this bet
  IF NOT EXISTS (
    SELECT 1 FROM public.bet_stories WHERE bet_id = NEW.id
  ) THEN
    INSERT INTO public.bet_stories (bet_id, user_id, expires_at)
    VALUES (NEW.id, NEW.user_id, NOW() + INTERVAL '24 hours');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create bet stories
DROP TRIGGER IF EXISTS auto_create_bet_story ON public.bets;
CREATE TRIGGER auto_create_bet_story
  AFTER INSERT ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_bet_story_for_new_bet();