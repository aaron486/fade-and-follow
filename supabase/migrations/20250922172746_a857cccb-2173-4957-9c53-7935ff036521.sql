-- Create friend requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create friendships table (for accepted connections)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering to prevent duplicates
);

-- Enable RLS on friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for friend_requests
CREATE POLICY "Users can view their own friend requests" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received" 
ON public.friend_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create friendships" 
ON public.friendships 
FOR INSERT 
WITH CHECK (true); -- This will be controlled by triggers/functions

-- Create trigger for updating timestamps
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create friendship when request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If request was accepted, create friendship
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friendships (user1_id, user2_id)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for friend request updates
CREATE TRIGGER on_friend_request_update
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_update();