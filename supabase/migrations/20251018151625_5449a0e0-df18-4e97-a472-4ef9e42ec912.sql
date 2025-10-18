-- Drop the trigger if it exists (in case of partial creation)
DROP TRIGGER IF EXISTS auto_create_bet_story ON public.bets;
DROP FUNCTION IF EXISTS public.create_bet_story_for_new_bet();

-- Create the function to automatically create bet stories
CREATE OR REPLACE FUNCTION public.create_bet_story_for_new_bet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create a bet story for every new bet
  INSERT INTO public.bet_stories (bet_id, user_id, expires_at)
  VALUES (NEW.id, NEW.user_id, NOW() + INTERVAL '24 hours')
  ON CONFLICT (bet_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER auto_create_bet_story
  AFTER INSERT ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_bet_story_for_new_bet();