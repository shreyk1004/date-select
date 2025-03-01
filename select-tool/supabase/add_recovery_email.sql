-- Execute this in the Supabase SQL Editor to add the recovery_email column

-- Add recovery_email column to polls table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'polls'
        AND column_name = 'recovery_email'
    ) THEN
        ALTER TABLE public.polls 
        ADD COLUMN recovery_email text;
    END IF;
END $$;

-- Update any RLS policies if necessary
