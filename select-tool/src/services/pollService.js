import { supabase } from '../supabaseClient';

// Generate a unique poll code
export const generatePollCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create a new poll
export const createPoll = async ({ title, adminName }) => {
  const pollCode = generatePollCode();
  const adminToken = crypto.randomUUID(); // Generate a secure token for admin access
  
  const { data, error } = await supabase
    .from('polls')
    .insert([
      { 
        code: pollCode,
        title: title,
        admin_name: adminName,
        admin_token: adminToken
      }
    ])
    .select();
  
  if (error) {
    throw new Error(`Failed to create poll: ${error.message}`);
  }
  
  return {
    code: pollCode,
    title,
    adminName,
    adminToken
  };
};

// Get poll by code
export const getPoll = async (pollCode) => {
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('code', pollCode)
    .single();
  
  if (pollError) {
    throw new Error(`Failed to fetch poll: ${pollError.message}`);
  }
  
  const { data: datesData, error: datesError } = await supabase
    .from('poll_dates')
    .select('date')
    .eq('poll_code', pollCode);
  
  if (datesError) {
    throw new Error(`Failed to fetch poll dates: ${datesError.message}`);
  }
  
  const { data: usersData, error: usersError } = await supabase
    .from('poll_users')
    .select('username')
    .eq('poll_code', pollCode);
  
  if (usersError) {
    throw new Error(`Failed to fetch poll users: ${usersError.message}`);
  }
  
  const { data: responseData, error: responseError } = await supabase
    .from('poll_responses')
    .select('*')
    .eq('poll_code', pollCode);
  
  if (responseError) {
    throw new Error(`Failed to fetch poll responses: ${responseError.message}`);
  }

  const { data: commentsData, error: commentsError } = await supabase
    .from('poll_comments')
    .select('*')
    .eq('poll_code', pollCode);
  
  if (commentsError) {
    throw new Error(`Failed to fetch poll comments: ${commentsError.message}`);
  }

  // Process data into a structured format
  const dates = datesData.map(dateObj => {
    const date = dateObj.date;
    const participants = responseData
      .filter(response => response.date === date)
      .map(response => ({
        name: response.username,
        available: response.available
      }));

    const comments = commentsData
      .filter(comment => comment.date === date)
      .map(comment => ({
        author: comment.username,
        text: comment.comment
      }));

    return {
      date,
      participants,
      comments
    };
  });
  
  return {
    id: pollData.id,
    code: pollData.code,
    title: pollData.title,
    admin: pollData.admin_name,
    dates: dates,
    users: usersData.map(user => user.username)
  };
};

// Add a date to a poll
export const addDateToPoll = async (pollCode, date, username) => {
  // First ensure the date exists in poll_dates
  const { error: dateError } = await supabase
    .from('poll_dates')
    .insert([
      { poll_code: pollCode, date }
    ]);
  
  if (dateError && !dateError.message.includes('duplicate key')) {
    throw new Error(`Failed to add date: ${dateError.message}`);
  }
  
  // If the user proposed the date, mark them as available
  if (username) {
    const { error: responseError } = await supabase
      .from('poll_responses')
      .insert([
        {
          poll_code: pollCode,
          date,
          username,
          available: true
        }
      ]);
    
    if (responseError && !responseError.message.includes('duplicate key')) {
      throw new Error(`Failed to set availability: ${responseError.message}`);
    }
  }
  
  return { success: true };
};

// Remove a date from a poll
export const removeDateFromPoll = async (pollCode, date) => {
  const { error } = await supabase
    .from('poll_dates')
    .delete()
    .eq('poll_code', pollCode)
    .eq('date', date);
  
  if (error) {
    throw new Error(`Failed to remove date: ${error.message}`);
  }
  
  return { success: true };
};

// Set user availability for a date
export const setAvailability = async (pollCode, date, username, isAvailable) => {
  // Upsert approach - insert if not exists, update if exists
  const { error } = await supabase
    .from('poll_responses')
    .upsert([
      {
        poll_code: pollCode,
        date,
        username,
        available: isAvailable,
        updated_at: new Date().toISOString()
      }
    ]);
  
  if (error) {
    throw new Error(`Failed to set availability: ${error.message}`);
  }
  
  return { success: true };
};

// Add a comment to a date
export const addComment = async (pollCode, date, username, comment) => {
  const { error } = await supabase
    .from('poll_comments')
    .insert([
      {
        poll_code: pollCode,
        date,
        username,
        comment
      }
    ]);
  
  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`);
  }
  
  return { success: true };
};

// Create the test poll if it doesn't exist
export const initializeTestPoll = async () => {
  // Check if test poll exists
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('code', 'test')
    .single();
  
  if (error && !error.message.includes('No rows found')) {
    throw new Error(`Error checking for test poll: ${error.message}`);
  }
  
  // If test poll doesn't exist, create it
  if (!data) {
    const { error: createError } = await supabase
      .from('polls')
      .insert([
        {
          code: 'test',
          title: 'Test Poll',
          admin_name: 'Admin',
          admin_token: 'test-admin-token'
        }
      ]);
    
    if (createError) {
      throw new Error(`Failed to create test poll: ${createError.message}`);
    }
    
    // Add default users
    const defaultUsers = ['Alice', 'Bob', 'Charlie', 'David'];
    for (const username of defaultUsers) {
      const { error: userError } = await supabase
        .from('poll_users')
        .insert([
          {
            poll_code: 'test',
            username
          }
        ]);
      
      if (userError && !userError.message.includes('duplicate key')) {
        throw new Error(`Failed to add user ${username}: ${userError.message}`);
      }
    }
  }
  
  return { success: true };
};
