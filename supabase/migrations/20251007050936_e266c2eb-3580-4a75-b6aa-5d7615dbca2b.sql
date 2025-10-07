-- Add specific requested sports betting influencers to public_bettors table
INSERT INTO public.public_bettors (username, display_name, bio, is_verified, social_handles, source_urls) VALUES
('JonPriceSports', 'Jon Price', 'Professional sports handicapper and betting analyst', true, '{"twitter": "JonPriceSports"}', ARRAY['https://twitter.com/JonPriceSports']),
('ErinKateDolan', 'Erin Dolan', 'Sports betting analyst and content creator', true, '{"twitter": "ErinKateDolan"}', ARRAY['https://twitter.com/ErinKateDolan']),
('katiefeeneyy', 'Katie Feeney', 'Sports content creator and social media influencer', true, '{"twitter": "katiefeeneyy"}', ARRAY['https://twitter.com/katiefeeneyy']),
('omarr_', 'Omar Raja', 'Sports highlight creator and viral content producer', true, '{"twitter": "omarr_"}', ARRAY['https://twitter.com/omarr_']),
('PitchingNinja', 'Rob Friedman (PitchingNinja)', 'MLB pitch analysis expert and baseball content creator', true, '{"twitter": "PitchingNinja"}', ARRAY['https://twitter.com/PitchingNinja']),
('NFL_DovKleiman', 'Dov Kleiman', 'NFL news aggregator and betting insights', true, '{"twitter": "NFL_DovKleiman"}', ARRAY['https://twitter.com/NFL_DovKleiman']),
('ArtButSports', 'ArtButMakeItSports', 'Creative sports content and viral sports moments', true, '{"twitter": "ArtButSports"}', ARRAY['https://twitter.com/ArtButSports'])
ON CONFLICT (username) DO NOTHING;