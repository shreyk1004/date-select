-- Execute this in the Supabase SQL Editor to create a test poll with sample data

-- First delete any existing test poll data to avoid conflicts
DELETE FROM public.poll_comments WHERE poll_code = 'test';
DELETE FROM public.poll_responses WHERE poll_code = 'test';
DELETE FROM public.poll_dates WHERE poll_code = 'test';
DELETE FROM public.poll_users WHERE poll_code = 'test';
DELETE FROM public.polls WHERE code = 'test';

-- Insert the test poll
INSERT INTO public.polls (code, title, admin_name, admin_token, created_at)
VALUES ('test', 'Test Poll', 'Admin', 'test-admin-token', now());

-- Insert test users
INSERT INTO public.poll_users (poll_code, username, created_at)
VALUES 
  ('test', 'Alice', now()),
  ('test', 'Bob', now()),
  ('test', 'Charlie', now()),
  ('test', 'David', now());

-- Insert test dates - using the next 10 days from today
DO $$
DECLARE 
  current_date date := CURRENT_DATE;
BEGIN
  -- Insert 5 dates (today + next 4 days)
  INSERT INTO public.poll_dates (poll_code, date)
  VALUES 
    ('test', current_date),
    ('test', current_date + 1),
    ('test', current_date + 3),
    ('test', current_date + 7),
    ('test', current_date + 14);

  -- Set up availability responses
  -- Alice is available for all dates
  INSERT INTO public.poll_responses (poll_code, date, username, available)
  VALUES 
    ('test', current_date, 'Alice', true),
    ('test', current_date + 1, 'Alice', true),
    ('test', current_date + 3, 'Alice', true),
    ('test', current_date + 7, 'Alice', true),
    ('test', current_date + 14, 'Alice', true);
  
  -- Bob is available for some dates
  INSERT INTO public.poll_responses (poll_code, date, username, available)
  VALUES 
    ('test', current_date, 'Bob', true),
    ('test', current_date + 1, 'Bob', false),
    ('test', current_date + 3, 'Bob', true),
    ('test', current_date + 7, 'Bob', false);
  
  -- Charlie is available for different dates
  INSERT INTO public.poll_responses (poll_code, date, username, available)
  VALUES 
    ('test', current_date, 'Charlie', false),
    ('test', current_date + 1, 'Charlie', true),
    ('test', current_date + 3, 'Charlie', true),
    ('test', current_date + 14, 'Charlie', true);
  
  -- David has mixed availability
  INSERT INTO public.poll_responses (poll_code, date, username, available)
  VALUES 
    ('test', current_date, 'David', false),
    ('test', current_date + 1, 'David', false),
    ('test', current_date + 3, 'David', true),
    ('test', current_date + 7, 'David', true),
    ('test', current_date + 14, 'David', true);
  
  -- Add some comments
  INSERT INTO public.poll_comments (poll_code, date, username, comment)
  VALUES 
    ('test', current_date, 'Alice', 'This date works well for me!'),
    ('test', current_date, 'Bob', 'I can make this work.'),
    ('test', current_date + 1, 'Charlie', 'This is my preferred date.'),
    ('test', current_date + 3, 'Bob', 'I have another meeting but can reschedule.'),
    ('test', current_date + 3, 'David', 'This is perfect for me.');

END $$;

-- Check if the data was inserted successfully
SELECT 'Polls' as table_name, count(*) FROM public.polls WHERE code = 'test'
UNION ALL
SELECT 'Users' as table_name, count(*) FROM public.poll_users WHERE poll_code = 'test'
UNION ALL
SELECT 'Dates' as table_name, count(*) FROM public.poll_dates WHERE poll_code = 'test'
UNION ALL
SELECT 'Responses' as table_name, count(*) FROM public.poll_responses WHERE poll_code = 'test'
UNION ALL
SELECT 'Comments' as table_name, count(*) FROM public.poll_comments WHERE poll_code = 'test';
