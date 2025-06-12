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
        
        -- Add a comment to track the migration
        COMMENT ON COLUMN public.polls.recovery_email IS 'Added for poll recovery functionality';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'polls' 
AND table_schema = 'public';

-- Update any RLS policies if necessary
