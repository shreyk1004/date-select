-- Execute this in the Supabase SQL Editor to add blocked dates functionality

-- Add blocked column to poll_dates table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'poll_dates' 
        AND column_name = 'blocked'
    ) THEN
        ALTER TABLE public.poll_dates 
        ADD COLUMN blocked boolean DEFAULT false;
        
        -- Add a comment to track the migration
        COMMENT ON COLUMN public.poll_dates.blocked IS 'Indicates if date is blocked by admin';
    END IF;
END $$;

-- Add blocked_at column to track when date was blocked
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'poll_dates' 
        AND column_name = 'blocked_at'
    ) THEN
        ALTER TABLE public.poll_dates 
        ADD COLUMN blocked_at timestamp with time zone;
        
        -- Add a comment to track the migration
        COMMENT ON COLUMN public.poll_dates.blocked_at IS 'Timestamp when date was blocked';
    END IF;
END $$;

-- Create an index for efficient blocked date queries
CREATE INDEX IF NOT EXISTS idx_poll_dates_blocked 
ON public.poll_dates(poll_code, blocked) 
WHERE blocked = true;

-- Add RLS policy to allow updating blocked dates
-- This allows anyone to update the blocked and blocked_at columns
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'poll_dates' 
        AND policyname = 'Enable update blocked dates for all users'
    ) THEN
        -- Create policy to allow updating poll_dates (including blocked columns)
        CREATE POLICY "Enable update blocked dates for all users" ON public.poll_dates
        FOR UPDATE USING (true);
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'poll_dates' 
AND table_schema = 'public'
ORDER BY ordinal_position; 

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'poll_dates'; 