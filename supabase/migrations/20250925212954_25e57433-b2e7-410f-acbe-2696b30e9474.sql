-- Add missing columns to existing bets table
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS channel_id UUID,
ADD COLUMN IF NOT EXISTS team_id TEXT,
ADD COLUMN IF NOT EXISTS wager_amount NUMERIC,
ADD COLUMN IF NOT EXISTS units NUMERIC;

-- Add foreign key constraints safely
DO $$
BEGIN
    -- Add channel foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bets_channel' 
        AND table_name = 'bets'
    ) THEN
        ALTER TABLE public.bets 
        ADD CONSTRAINT fk_bets_channel 
        FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE SET NULL;
    END IF;

    -- Add team foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bets_team' 
        AND table_name = 'bets'
    ) THEN
        ALTER TABLE public.bets 
        ADD CONSTRAINT fk_bets_team 
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_channel_id ON public.bets(channel_id);
CREATE INDEX IF NOT EXISTS idx_bets_team_id ON public.bets(team_id);