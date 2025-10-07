-- Add celebrity athletes and high-profile sports bettors to public_bettors table
INSERT INTO public.public_bettors (username, display_name, bio, is_verified, social_handles, source_urls) VALUES
('Drake', 'Drake', 'Grammy-winning artist known for massive sports bets and "Drake Curse"', true, '{"twitter": "Drake"}', ARRAY['https://twitter.com/Drake']),
('FloydMayweather', 'Floyd Mayweather', 'Undefeated boxing champion known for multi-million dollar sports bets', true, '{"twitter": "FloydMayweather"}', ARRAY['https://twitter.com/FloydMayweather']),
('MichaelJordan', 'Michael Jordan', 'NBA legend and competitive gambler', true, '{"twitter": "MichaelJordan"}', ARRAY['https://twitter.com/MichaelJordan']),
('CharlesBarkley', 'Charles Barkley', 'NBA Hall of Famer and TNT analyst known for gambling stories', true, '{"twitter": "CharlesBarkley"}', ARRAY['https://twitter.com/CharlesBarkley']),
('PhilMickelson', 'Phil Mickelson', 'Golf legend known for high-stakes sports betting', true, '{"twitter": "PhilMickelson"}', ARRAY['https://twitter.com/PhilMickelson']),
('aplusk', 'Ashton Kutcher', 'Actor and entrepreneur with interest in sports betting', true, '{"twitter": "aplusk"}', ARRAY['https://twitter.com/aplusk']),
('50cent', '50 Cent', 'Rapper and entrepreneur known for big sports bets', true, '{"twitter": "50cent"}', ARRAY['https://twitter.com/50cent']),
('iamjamiefoxx', 'Jamie Foxx', 'Oscar-winning actor and sports betting enthusiast', true, '{"twitter": "iamjamiefoxx"}', ARRAY['https://twitter.com/iamjamiefoxx']),
('BIRDMAN5STAR', 'Birdman', 'Rapper and music executive known for sports betting', true, '{"twitter": "BIRDMAN5STAR"}', ARRAY['https://twitter.com/BIRDMAN5STAR']),
('RealMattLucas', 'Matt Lucas', 'High-stakes sports bettor', true, '{"twitter": "RealMattLucas"}', ARRAY['https://twitter.com/RealMattLucas']),
('Cristiano', 'Cristiano Ronaldo', 'Soccer superstar and global sports icon', true, '{"twitter": "Cristiano"}', ARRAY['https://twitter.com/Cristiano']),
('TheNotoriousMMA', 'Conor McGregor', 'UFC champion known for bold predictions and betting', true, '{"twitter": "TheNotoriousMMA"}', ARRAY['https://twitter.com/TheNotoriousMMA']),
('Ibra_official', 'Zlatan Ibrahimović', 'Soccer legend known for confident predictions', true, '{"twitter": "Ibra_official"}', ARRAY['https://twitter.com/Ibra_official']),
('MikeTyson', 'Mike Tyson', 'Boxing legend and sports personality', true, '{"twitter": "MikeTyson"}', ARRAY['https://twitter.com/MikeTyson']),
('ShaneWarne', 'Shane Warne', 'Cricket legend known for sports betting interest', true, '{"twitter": "ShaneWarne"}', ARRAY['https://twitter.com/ShaneWarne']),
('milliondollarmarco', 'Marco Piemonte', 'High-stakes sports bettor and handicapper', true, '{"twitter": "milliondollarmarco"}', ARRAY['https://twitter.com/milliondollarmarco']),
('lucakante', 'Luca Kante', 'Professional sports bettor and analyst', true, '{"twitter": "lucakante"}', ARRAY['https://twitter.com/lucakante']),
('diceyninja', 'Dicey Ninja', 'Sports betting expert and content creator', true, '{"twitter": "diceyninja"}', ARRAY['https://twitter.com/diceyninja']),
('shelbybilby', 'Shelby Bilby', 'Sports betting personality and analyst', true, '{"twitter": "shelbybilby"}', ARRAY['https://twitter.com/shelbybilby']),
('mazivs', 'Mazi VS', 'Sports betting content creator and tipster', true, '{"twitter": "mazivs"}', ARRAY['https://twitter.com/mazivs']),
('bigbetmike', 'BigBetMike', 'High-stakes sports bettor and handicapper', true, '{"twitter": "bigbetmike"}', ARRAY['https://twitter.com/bigbetmike'])
ON CONFLICT (username) DO NOTHING;