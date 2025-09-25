-- Create channels table
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel_members table
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Add foreign key constraints
ALTER TABLE public.channel_members 
ADD CONSTRAINT fk_channel_members_channel 
FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
CREATE POLICY "Users can create channels" 
ON public.channels 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view channels they belong to" 
ON public.channels 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.channel_members 
  WHERE channel_members.channel_id = channels.id 
  AND channel_members.user_id = auth.uid()
));

CREATE POLICY "Channel admins can update channels" 
ON public.channels 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.channel_members 
  WHERE channel_members.channel_id = channels.id 
  AND channel_members.user_id = auth.uid() 
  AND channel_members.role = 'admin'
));

-- RLS Policies for channel_members
CREATE POLICY "Channel admins can add members" 
ON public.channel_members 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.channel_members existing_members
  WHERE existing_members.channel_id = channel_members.channel_id 
  AND existing_members.user_id = auth.uid() 
  AND existing_members.role = 'admin'
) OR (
  -- Allow the first member (creator) to be added
  NOT EXISTS (
    SELECT 1 FROM public.channel_members existing_members
    WHERE existing_members.channel_id = channel_members.channel_id
  ) AND role = 'admin'
));

CREATE POLICY "Users can view channel members for channels they belong to" 
ON public.channel_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.channel_members user_membership
  WHERE user_membership.channel_id = channel_members.channel_id 
  AND user_membership.user_id = auth.uid()
));

CREATE POLICY "Channel admins can remove members" 
ON public.channel_members 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.channel_members admin_membership
  WHERE admin_membership.channel_id = channel_members.channel_id 
  AND admin_membership.user_id = auth.uid() 
  AND admin_membership.role = 'admin'
) OR channel_members.user_id = auth.uid()); -- Users can leave channels themselves

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_channels_updated_at
BEFORE UPDATE ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_channels_created_by ON public.channels(created_by);
CREATE INDEX idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX idx_channel_members_user_id ON public.channel_members(user_id);