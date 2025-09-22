-- Add social media columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN instagram_url TEXT,
ADD COLUMN tiktok_url TEXT,
ADD COLUMN x_url TEXT,
ADD COLUMN discord_url TEXT;

-- Update the handle_new_user function to include social media fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    username, 
    display_name, 
    favorite_team, 
    state, 
    preferred_sportsbook,
    instagram_url,
    tiktok_url,
    x_url,
    discord_url
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'favorite_team',
    NEW.raw_user_meta_data ->> 'state',
    NEW.raw_user_meta_data ->> 'preferred_sportsbook',
    NEW.raw_user_meta_data ->> 'instagram_url',
    NEW.raw_user_meta_data ->> 'tiktok_url',
    NEW.raw_user_meta_data ->> 'x_url',
    NEW.raw_user_meta_data ->> 'discord_url'
  );
  RETURN NEW;
END;
$function$;