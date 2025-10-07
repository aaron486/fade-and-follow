-- Insert mock celebrity bettors
INSERT INTO public.public_bettors (id, username, display_name, avatar_url, is_verified, follower_count, bio, social_handles)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'sharpshooter', 'Mike "The Sharp" Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', true, 45000, 'Pro sports analyst | 15 years experience | Follow for winners', '{"twitter": "@sharpshooter", "instagram": "@mikethesharp"}'),
  ('22222222-2222-2222-2222-222222222222', 'bettingqueen', 'Sarah "Queen" Martinez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', true, 38000, 'NFL & NBA specialist | Trust the process', '{"twitter": "@bettingqueen", "tiktok": "@queenpicks"}'),
  ('33333333-3333-3333-3333-333333333333', 'vegasvictor', 'Victor "Vegas" Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=victor', true, 52000, 'Vegas insider | MLB expert | 58% win rate', '{"twitter": "@vegasvictor", "youtube": "VictorVegas"}')
ON CONFLICT (id) DO NOTHING;

-- Insert mock celebrity picks
INSERT INTO public.public_picks (id, bettor_id, sport, event_name, market, selection, odds, stake_units, status, confidence, reasoning, posted_at)
VALUES 
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'NFL', 'Kansas City Chiefs vs Buffalo Bills', 'Spread', 'Chiefs -3.5', -110, 2, 'win', 'high', 'Chiefs defense has been dominant at home. Bills struggling with injuries on offensive line.', now() - interval '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'NBA', 'Los Angeles Lakers vs Boston Celtics', 'Moneyline', 'Lakers', 120, 1, 'pending', 'medium', 'LeBron historically performs well against Boston. Lakers coming off 3 days rest.', now() - interval '1 hour'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'NBA', 'Golden State Warriors vs Phoenix Suns', 'Total', 'Over 228.5', -105, 1.5, 'pending', 'high', 'Both teams top 5 in pace. Warriors defense allowing 118 ppg last 5 games.', now() - interval '30 minutes'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'NFL', 'Dallas Cowboys vs Philadelphia Eagles', 'Spread', 'Eagles -7', -110, 2, 'loss', 'medium', 'Eagles have won last 3 matchups by double digits. Cowboys missing key defensive players.', now() - interval '1 day'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'MLB', 'New York Yankees vs Boston Red Sox', 'Moneyline', 'Yankees', -140, 1, 'win', 'high', 'Yankees ace on the mound with 2.15 ERA. Red Sox batting .210 vs lefties.', now() - interval '3 hours'),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'NBA', 'Miami Heat vs Milwaukee Bucks', 'Spread', 'Heat +5.5', -110, 1.5, 'pending', 'medium', 'Heat playing great defense lately. Bucks on back-to-back, could be tired.', now() - interval '45 minutes')
ON CONFLICT DO NOTHING;

-- Update the public bettor records
INSERT INTO public.public_bettor_records (bettor_id, wins, losses, pushes, units_won, current_streak, longest_streak, last_pick_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 12, 8, 1, 4.5, 1, 5, now() - interval '1 hour'),
  ('22222222-2222-2222-2222-222222222222', 15, 10, 2, 6.2, -1, 7, now() - interval '30 minutes'),
  ('33333333-3333-3333-3333-333333333333', 18, 7, 1, 9.8, 1, 8, now() - interval '45 minutes')
ON CONFLICT (bettor_id) DO UPDATE SET
  wins = EXCLUDED.wins,
  losses = EXCLUDED.losses,
  pushes = EXCLUDED.pushes,
  units_won = EXCLUDED.units_won,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  last_pick_at = EXCLUDED.last_pick_at;