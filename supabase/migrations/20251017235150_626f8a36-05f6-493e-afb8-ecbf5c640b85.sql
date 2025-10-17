-- Update league names to new convention
UPDATE public.teams
SET league = 'NCAAFB'
WHERE league = 'NCAA' AND sport = 'Football';

UPDATE public.teams
SET league = 'NCAABB'
WHERE league = 'NCAA' AND sport = 'Basketball';

-- NFL and MLB should already be correct, but ensuring consistency
UPDATE public.teams
SET league = 'NFL'
WHERE league LIKE '%NFL%' AND sport = 'Football';

UPDATE public.teams
SET league = 'MLB'
WHERE league LIKE '%MLB%' AND sport = 'Baseball';