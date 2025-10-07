-- Update social media handles for all celebrity bettors

-- Barstool personalities
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/stoolpresidente',
  'instagram', 'https://instagram.com/stoolpresidente',
  'tiktok', 'https://tiktok.com/@stoolpresidente',
  'youtube', 'https://youtube.com/@barstools ports'
) WHERE username = 'stoolpresidente';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/BarstoolBigCat',
  'tiktok', 'https://tiktok.com/@_barstoolbigcat',
  'instagram', 'https://instagram.com/barstoolbigcat'
) WHERE username = 'BarstoolBigCat';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/TheCousinSal',
  'instagram', 'https://instagram.com/thecousinsalsal'
) WHERE username = 'TheCousinSal';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/BookitWentTrent',
  'instagram', 'https://instagram.com/bookitwithtrent',
  'tiktok', 'https://tiktok.com/@bookitwithtrent',
  'twitch', 'https://twitch.tv/bookitsports',
  'website', 'https://beacons.ai/bookitwithtrent'
) WHERE username = 'BookitWentTrent';

-- Top betting influencers
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/mrbankstips',
  'instagram', 'https://instagram.com/mrbankstips',
  'tiktok', 'https://tiktok.com/@mrbankstips'
) WHERE username = 'mrbankstips';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/MatthewBerryTMR',
  'instagram', 'https://instagram.com/matthewberrytmr',
  'tiktok', 'https://tiktok.com/@matthewberrytmr',
  'youtube', 'https://youtube.com/@NBCSports',
  'website', 'https://nbcsports.com/nfl/matthew-berry'
) WHERE username = 'MatthewBerryTMR';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/tmathsports',
  'instagram', 'https://instagram.com/tmathsports',
  'tiktok', 'https://tiktok.com/@tmathsports',
  'website', 'https://linktr.ee/taylor_mathis'
) WHERE username = 'tmathsports';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/erinkatedolan',
  'instagram', 'https://instagram.com/erinkatedolan',
  'tiktok', 'https://tiktok.com/@erinkatedolan',
  'website', 'https://espnpressroom.com/us/bios/erin-dolan/'
) WHERE username = 'erinkatedolan';

-- ESPN personalities
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/DougESPN',
  'website', 'https://espn.com'
) WHERE username = 'DougESPN';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/DavidPurdum',
  'website', 'https://espn.com'
) WHERE username = 'DavidPurdum';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/chrisfallica',
  'instagram', 'https://instagram.com/chrisfallica'
) WHERE username = 'chrisfallica';

-- Action Network analysts
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/chadmillman',
  'website', 'https://actionnetwork.com'
) WHERE username = 'chadmillman';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/darrenrovell',
  'instagram', 'https://instagram.com/darrenrovell',
  'website', 'https://actionnetwork.com'
) WHERE username = 'darrenrovell';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/wheatonbrando',
  'website', 'https://actionnetwork.com'
) WHERE username = 'wheatonbrando';

-- VSiN personalities
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/brentmusburger',
  'website', 'https://vsin.com'
) WHERE username = 'brentmusburger';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/ViewFromVegas',
  'website', 'https://vsin.com'
) WHERE username = 'ViewFromVegas';

-- Professional bettors
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/capjack2000',
  'website', 'https://unabated.com'
) WHERE username = 'capjack2000';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/BillKrackman',
  'instagram', 'https://instagram.com/billkrackomberger'
) WHERE username = 'BillKrackman';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/DrBobSports',
  'website', 'https://drbobsports.com'
) WHERE username = 'DrBobSports';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/BradPowers7',
  'instagram', 'https://instagram.com/bradpowers7'
) WHERE username = 'BradPowers7';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/whale_capper',
  'website', 'https://betsperts.com'
) WHERE username = 'whale_capper';

-- Data and analytics experts
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/evansilva',
  'website', 'https://establishtherun.com'
) WHERE username = 'evansilva';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/adamlevitan',
  'website', 'https://establishtherun.com'
) WHERE username = 'adamlevitan';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/thepowerrank',
  'website', 'https://thepowerrank.com'
) WHERE username = 'thepowerrank';

-- Vegas sportsbook personnel
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/CircaSports',
  'instagram', 'https://instagram.com/circasports',
  'website', 'https://circasports.com'
) WHERE username = 'CircaSports';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/BetChris',
  'website', 'https://circasports.com'
) WHERE username = 'BetChris';

-- DFS and props specialists
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/thepme',
  'website', 'https://pmeonline.com'
) WHERE username = 'thepme';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/arielepstein',
  'instagram', 'https://instagram.com/arielepstein',
  'tiktok', 'https://tiktok.com/@arielepstein'
) WHERE username = 'arielepstein';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/jeffratcliffe',
  'instagram', 'https://instagram.com/jeffratcliffe',
  'website', 'https://ftnfantasy.com'
) WHERE username = 'jeffratcliffe';

-- YouTube channels
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/sloprules',
  'youtube', 'https://youtube.com/@sloprules',
  'instagram', 'https://instagram.com/sloprules'
) WHERE username = 'sloprules';

-- Additional major handicappers
UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/spanky',
  'website', 'https://betbash.co'
) WHERE username = 'spanky';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/skeeprofit',
  'website', 'https://wagertalk.com'
) WHERE username = 'skeeprofit';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/webeatthespread',
  'instagram', 'https://instagram.com/webeatthespread'
) WHERE username = 'webeatthespread';

UPDATE public.public_bettors SET social_handles = jsonb_build_object(
  'twitter', 'https://twitter.com/ESPNStatsInfo',
  'website', 'https://espn.com'
) WHERE username = 'ESPNStatsInfo';

-- Set default social handles for remaining bettors (Twitter only)
UPDATE public.public_bettors 
SET social_handles = jsonb_build_object('twitter', 'https://twitter.com/' || username)
WHERE social_handles IS NULL OR social_handles = '{}'::jsonb;