-- Create storage bucket for bet screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('bet-screenshots', 'bet-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Add image_url column to bets table to track screenshots
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create RLS policies for bet screenshots bucket
CREATE POLICY "Users can upload their own bet screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bet-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own bet screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bet-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own bet screenshots"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'bet-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public bet screenshots are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bet-screenshots');