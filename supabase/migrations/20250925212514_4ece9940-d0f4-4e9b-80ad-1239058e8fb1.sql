-- Create teams table for sports betting
CREATE TABLE public.teams (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  name TEXT NOT NULL,
  mascot TEXT NOT NULL,
  logo_url TEXT,
  sport TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read teams (public data)
CREATE POLICY "Teams are publicly readable" 
ON public.teams 
FOR SELECT 
USING (true);

-- Create policy to restrict writes to admins only (if needed later)
-- For now, we'll allow inserts for initial data seeding
CREATE POLICY "Anyone can insert teams for now" 
ON public.teams 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_teams_league ON public.teams(league);
CREATE INDEX idx_teams_sport ON public.teams(sport);
CREATE INDEX idx_teams_name ON public.teams(name);