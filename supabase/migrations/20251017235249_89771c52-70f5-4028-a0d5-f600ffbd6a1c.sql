-- Update NCAA Football league name back to "NCAA Football"
UPDATE public.teams
SET league = 'NCAA Football'
WHERE league = 'NCAAFB' AND sport = 'Football';