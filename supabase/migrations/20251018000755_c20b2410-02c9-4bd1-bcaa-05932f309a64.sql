-- Add remaining NBA teams (20 teams missing)
INSERT INTO public.teams (id, name, mascot, league, sport, logo_url) VALUES
('1610612747', 'Los Angeles Lakers', 'Lakers', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png'),
('1610612748', 'Miami Heat', 'Heat', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png'),
('1610612749', 'Milwaukee Bucks', 'Bucks', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png'),
('1610612750', 'Minnesota Timberwolves', 'Timberwolves', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/min.png'),
('1610612751', 'New Orleans Pelicans', 'Pelicans', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/no.png'),
('1610612752', 'New York Knicks', 'Knicks', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png'),
('1610612753', 'Orlando Magic', 'Magic', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png'),
('1610612754', 'Indiana Pacers', 'Pacers', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png'),
('1610612755', 'Philadelphia 76ers', '76ers', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png'),
('1610612756', 'Phoenix Suns', 'Suns', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png'),
('1610612757', 'Portland Trail Blazers', 'Trail Blazers', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/por.png'),
('1610612758', 'Sacramento Kings', 'Kings', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png'),
('1610612759', 'San Antonio Spurs', 'Spurs', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png'),
('1610612760', 'Oklahoma City Thunder', 'Thunder', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png'),
('1610612761', 'Toronto Raptors', 'Raptors', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png'),
('1610612762', 'Utah Jazz', 'Jazz', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png'),
('1610612763', 'Memphis Grizzlies', 'Grizzlies', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png'),
('1610612764', 'Washington Wizards', 'Wizards', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png'),
('1610612765', 'Houston Rockets', 'Rockets', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png'),
('1610612766', 'Los Angeles Clippers', 'Clippers', 'NBA', 'basketball', 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png')
ON CONFLICT (id) DO NOTHING;