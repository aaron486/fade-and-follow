-- Add favorite_teams array to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS favorite_teams text[] DEFAULT '{}';

-- Update existing favorite_team data to favorite_teams array
UPDATE public.profiles 
SET favorite_teams = ARRAY[favorite_team]
WHERE favorite_team IS NOT NULL AND favorite_team != '';

-- Create feed_items table for AI-generated content
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  sport text NOT NULL,
  team_ids text[] DEFAULT '{}',
  source_url text,
  image_url text,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on feed_items
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view feed items
CREATE POLICY "Feed items are viewable by everyone"
ON public.feed_items
FOR SELECT
USING (true);

-- Policy: System can insert feed items (for scraper)
CREATE POLICY "System can insert feed items"
ON public.feed_items
FOR INSERT
WITH CHECK (true);

-- Create index for faster team-based queries
CREATE INDEX IF NOT EXISTS idx_feed_items_team_ids ON public.feed_items USING GIN(team_ids);
CREATE INDEX IF NOT EXISTS idx_feed_items_published_at ON public.feed_items(published_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_feed_items_updated_at
  BEFORE UPDATE ON public.feed_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();