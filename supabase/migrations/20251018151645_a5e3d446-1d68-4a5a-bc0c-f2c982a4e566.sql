-- Add unique constraint on bet_id to prevent duplicate stories for the same bet
ALTER TABLE public.bet_stories
ADD CONSTRAINT bet_stories_bet_id_unique UNIQUE (bet_id);