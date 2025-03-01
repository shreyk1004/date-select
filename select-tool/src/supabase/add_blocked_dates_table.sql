-- Execute this in the Supabase SQL Editor to add the blocked_dates table

-- Create the poll_blocked_dates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.poll_blocked_dates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_code text NOT NULL REFERENCES public.polls(code) ON DELETE CASCADE,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    
    -- Create a unique constraint on poll_code and date
    UNIQUE(poll_code, date)
);

-- Set up row level security
ALTER TABLE public.poll_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access for poll_blocked_dates" 
ON public.poll_blocked_dates FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Allow admin to modify poll_blocked_dates" 
ON public.poll_blocked_dates FOR ALL 
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1 FROM public.polls p 
        WHERE p.code = poll_code 
        AND p.admin_token = auth.uid()::text
    )
);
