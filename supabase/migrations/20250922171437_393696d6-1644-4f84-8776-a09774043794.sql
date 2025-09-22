-- Add new columns to profiles table for team, state, and sportsbook
ALTER TABLE public.profiles 
ADD COLUMN favorite_team TEXT,
ADD COLUMN state TEXT,
ADD COLUMN preferred_sportsbook TEXT;