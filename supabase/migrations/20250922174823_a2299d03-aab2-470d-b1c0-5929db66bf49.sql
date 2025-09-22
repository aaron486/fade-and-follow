-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_memberships table
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
CREATE POLICY "Users can view groups they belong to" 
ON public.groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = groups.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group admins can update groups" 
ON public.groups 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = groups.id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policies for group_memberships
CREATE POLICY "Users can view group memberships for groups they belong to" 
ON public.group_memberships 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships gm 
    WHERE gm.group_id = group_memberships.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can add members" 
ON public.group_memberships 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = group_memberships.group_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  ) OR (
    -- Creator can add themselves as admin when creating group
    NOT EXISTS (SELECT 1 FROM public.group_memberships WHERE group_id = group_memberships.group_id)
    AND role = 'admin'
  )
);

CREATE POLICY "Group admins can remove members" 
ON public.group_memberships 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = group_memberships.group_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  ) OR user_id = auth.uid() -- Users can leave groups themselves
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();