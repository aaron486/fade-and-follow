-- Create scraping jobs table to track progress
CREATE TABLE IF NOT EXISTS public.scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  total_accounts INTEGER DEFAULT 0,
  processed_accounts INTEGER DEFAULT 0,
  successful_picks INTEGER DEFAULT 0,
  failed_accounts INTEGER DEFAULT 0,
  current_account TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view scraping jobs
CREATE POLICY "Admins can view scraping jobs"
ON public.scraping_jobs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can manage scraping jobs
CREATE POLICY "System can manage scraping jobs"
ON public.scraping_jobs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_started_at ON public.scraping_jobs(started_at DESC);