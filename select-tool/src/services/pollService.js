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

// Create a new poll - Enhanced to include optional recovery email
export const createPoll = async ({ title, adminName, recoveryEmail }) => {
  const pollCode = generatePollCode();
  const adminToken = crypto.randomUUID(); // Generate a secure token for admin access
  
  try {
    // Step 1: Create the poll in the polls table with optional recovery email
    const { error: pollError } = await supabase
      .from('polls')
      .insert([
        { 
          code: pollCode,
          title: title,
          admin_name: adminName,
          admin_token: adminToken,
          recovery_email: recoveryEmail || null // Store recovery email if provided
        }
      ]);
    
    if (pollError) {
      throw new Error(`Failed to create poll: ${pollError.message}`);
    }
    
    // Step 2: Add the admin as the first user
    const { error: userError } = await supabase
      .from('poll_users')
      .insert([
        {
          poll_code: pollCode,
          username: adminName,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (userError) {
      throw new Error(`Failed to add admin user: ${userError.message}`);
    }
    
    // Return the new poll data with admin details
    return {
      code: pollCode,
      title,
      adminName,
      adminToken,
      recoveryEmail: recoveryEmail || null
    };
  } catch (error) {
    console.error('Error in createPoll:', error);
    throw error;
  }
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

// Ensure user exists in poll_users table
export const ensureUserExists = async (pollCode, username) => {
  try {
    // Check if user already exists in the poll
    const { data, error: queryError } = await supabase
      .from('poll_users')
      .select('*')
      .eq('poll_code', pollCode)
      .eq('username', username);
    
    if (queryError) {
      throw new Error(`Error checking user: ${queryError.message}`);
    }
    
    // If user doesn't exist, create them
    if (!data || data.length === 0) {
      const { error: createError } = await supabase
        .from('poll_users')
        .insert([{ 
          poll_code: pollCode, 
          username,
          created_at: new Date().toISOString()
        }]);
        
      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
};

// Add a date to a poll (updated to ensure user exists first)
export const addDateToPoll = async (pollCode, date, username) => {
  try {
    // First ensure the user exists in poll_users
    await ensureUserExists(pollCode, username);
    
    // Then add the date
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
  } catch (error) {
    console.error('Error in addDateToPoll:', error);
    throw error;
  }
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

// Set user availability for a date (updated to ensure user exists first)
export const setAvailability = async (pollCode, date, username, isAvailable) => {
  try {
    // First ensure the user exists in poll_users
    await ensureUserExists(pollCode, username);
    
    // Check if a response already exists for this user and date
    const { data: existingResponses, error: checkError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_code', pollCode)
      .eq('date', date)
      .eq('username', username);
    
    if (checkError) {
      throw new Error(`Error checking existing response: ${checkError.message}`);
    }

    // If response exists, update it; otherwise insert a new one
    let error;
    
    if (existingResponses && existingResponses.length > 0) {
      // Update existing response - use the ID for the first match
      const { error: updateError } = await supabase
        .from('poll_responses')
        .update({ 
          available: isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResponses[0].id);
      
      error = updateError;
    } else {
      // Insert new response
      const { error: insertError } = await supabase
        .from('poll_responses')
        .insert([{
          poll_code: pollCode,
          date,
          username,
          available: isAvailable,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      error = insertError;
    }
    
    if (error) {
      throw new Error(`Failed to set availability: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in setAvailability:', error);
    throw error;
  }
};

// Add a comment to a date (updated to ensure user exists first)
export const addComment = async (pollCode, date, username, comment) => {
  try {
    // First ensure the user exists in poll_users
    await ensureUserExists(pollCode, username);
    
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
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
};

// Updated function to use the database test poll instead of the localStorage one
export const initializeTestPoll = async () => {
  // Check if test poll exists in database
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('code', 'test')
    .single();
  
  if (error && !error.message.includes('No rows found')) {
    throw new Error(`Error checking for test poll: ${error.message}`);
  }
  
  // If test poll doesn't exist in database but we need to create it,
  // redirect the user to run the initialize_test_poll.sql script
  if (!data) {
    throw new Error(
      'Test poll not found in database. Please run the initialize_test_poll.sql script in the Supabase SQL Editor.'
    );
  }
  
  return { success: true, poll: data };
};
