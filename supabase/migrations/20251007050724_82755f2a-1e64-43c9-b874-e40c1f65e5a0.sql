-- Add popular sports betting influencers to public_bettors table
INSERT INTO public.public_bettors (username, display_name, bio, is_verified, social_handles, source_urls) VALUES
('SharpFootball', 'Warren Sharp', 'NFL analyst with documented 18-year track record. Data-driven football analysis and betting insights.', true, '{"twitter": "SharpFootball", "website": "sharpfootballanalysis.com"}', ARRAY['https://twitter.com/SharpFootball']),
('BWalkerSEC', 'Brandon Walker', 'Barstool Sports - College Football Expert and Mississippi State superfan', true, '{"twitter": "BWalkerSEC", "instagram": "bwalkersec"}', ARRAY['https://twitter.com/BWalkerSEC']),
('MartyMush', 'Marty Mush', 'Barstool Sports personality and sports bettor', true, '{"twitter": "MartyMush", "instagram": "martymush"}', ARRAY['https://twitter.com/MartyMush']),
('BillSimmons', 'Bill Simmons', 'The Ringer founder, sports media icon, NBA and NFL betting insights', true, '{"twitter": "BillSimmons"}', ARRAY['https://twitter.com/BillSimmons']),
('TheCousinSal', 'Cousin Sal', 'Jimmy Kimmel Show writer, Against All Odds podcast host', true, '{"twitter": "TheCousinSal"}', ARRAY['https://twitter.com/TheCousinSal']),
('darrenrovell', 'Darren Rovell', 'Sports business reporter covering betting industry and odds', true, '{"twitter": "darrenrovell"}', ARRAY['https://twitter.com/darrenrovell']),
('PatMcAfeeShow', 'Pat McAfee', 'Former NFL punter, The Pat McAfee Show host, daily sports betting talk', true, '{"twitter": "PatMcAfeeShow", "youtube": "ThePatMcAfeeShow"}', ARRAY['https://twitter.com/PatMcAfeeShow']),
('ColinCowherd', 'Colin Cowherd', 'The Herd host, NFL and NBA betting analysis', true, '{"twitter": "ColinCowherd"}', ARRAY['https://twitter.com/ColinCowherd']),
('KFCBarstool', 'KFC', 'Barstool Sports - KFC Radio host and sports bettor', true, '{"twitter": "KFCBarstool", "instagram": "kfcbarstool"}', ARRAY['https://twitter.com/KFCBarstool']),
('FeitsBarstool', 'John Feitelberg', 'Barstool Sports personality and daily gambler', true, '{"twitter": "FeitsBarstool"}', ARRAY['https://twitter.com/FeitsBarstool']),
('RyanRuocco', 'Ryan Ruocco', 'ESPN broadcaster covering NBA, NFL, and MLB with betting insights', true, '{"twitter": "RyanRuocco"}', ARRAY['https://twitter.com/RyanRuocco']),
('ActionNetworkHQ', 'Action Network', 'Leading sports betting media company with expert picks', true, '{"twitter": "ActionNetworkHQ", "website": "actionnetwork.com"}', ARRAY['https://twitter.com/ActionNetworkHQ'])
ON CONFLICT (username) DO NOTHING;