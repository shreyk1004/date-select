import { supabase } from '../supabaseClient';

// Generate a unique poll code
export const generatePollCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create a new poll
export const createPoll = async ({ title, adminName, recoveryEmail }) => {
  const pollCode = generatePollCode();
  const adminToken = crypto.randomUUID();
  
  try {
    // Create the poll
    const { error: pollError } = await supabase
      .from('polls')
      .insert([{
        code: pollCode,
        title: title,
        admin_name: adminName,
        admin_token: adminToken,
        recovery_email: recoveryEmail || null
      }]);
    
    if (pollError) throw new Error(`Failed to create poll: ${pollError.message}`);
    
    // Add admin as first user
    const { error: userError } = await supabase
      .from('poll_users')
      .insert([{
        poll_code: pollCode,
        username: adminName
      }]);
    
    if (userError) throw new Error(`Failed to add admin user: ${userError.message}`);
    
    return {
      code: pollCode,
      title,
      adminName,
      adminToken,
      recoveryEmail: recoveryEmail || null
    };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

// Check if a poll exists (for validation)
export const validatePollCode = async (pollCode) => {
  if (pollCode === 'test') return true;
  
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('code')
      .eq('code', pollCode)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
};

// Get complete poll data in frontend format
export const getCompletePollData = async (pollCode) => {
  try {
    // Get poll basic info
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('code', pollCode)
      .single();
    
    if (pollError) throw new Error(`Poll not found: ${pollError.message}`);
    
    // Get all users
    const { data: usersData, error: usersError } = await supabase
      .from('poll_users')
      .select('username')
      .eq('poll_code', pollCode);
    
    if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);
    
    // Get all dates
    const { data: datesData, error: datesError } = await supabase
      .from('poll_dates')
      .select('date')
      .eq('poll_code', pollCode)
      .order('date');
    
    if (datesError) throw new Error(`Failed to fetch dates: ${datesError.message}`);
    
    // Get all responses
    const { data: responsesData, error: responsesError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_code', pollCode);
    
    if (responsesError) throw new Error(`Failed to fetch responses: ${responsesError.message}`);
    
    // Get all comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('poll_comments')
      .select('*')
      .eq('poll_code', pollCode)
      .order('created_at');
    
    if (commentsError) throw new Error(`Failed to fetch comments: ${commentsError.message}`);
    
    // Convert to frontend format
    const dates = (datesData || []).map(dateObj => {
      const date = dateObj.date;
      
      // Get participants for this date
      const participants = (responsesData || [])
        .filter(response => response.date === date)
        .map(response => ({
          name: response.username,
          available: response.available
        }));
      
      // Get comments for this date
      const comments = (commentsData || [])
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
      id: pollData.code,
      title: pollData.title,
      creator: pollData.admin_name,
      adminToken: pollData.admin_token,
      dates: dates,
      users: (usersData || []).map(user => user.username),
      status: 'active'
    };
  } catch (error) {
    console.error('Error getting complete poll data:', error);
    throw error;
  }
};

// Get users for a poll
export const getPollUsers = async (pollCode) => {
  if (pollCode === 'test') {
    return ['Alice', 'Bob', 'Charlie', 'David'];
  }
  
  try {
    const { data, error } = await supabase
      .from('poll_users')
      .select('username')
      .eq('poll_code', pollCode);
    
    if (error) throw new Error(`Failed to get users: ${error.message}`);
    
    return (data || []).map(user => user.username);
  } catch (error) {
    console.error('Error getting poll users:', error);
    return [];
  }
};

// Add or ensure user exists
export const addUserToPoll = async (pollCode, username) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from('poll_users')
      .select('username')
      .eq('poll_code', pollCode)
      .eq('username', username)
      .single();
    
    // If user already exists, return success
    if (existingUser) {
      return { success: true };
    }
    
    // Otherwise, insert new user
    const { error } = await supabase
      .from('poll_users')
      .insert([{
        poll_code: pollCode,
        username: username
      }]);
    
    if (error) {
      // If it's a duplicate key error, that's fine - user already exists
      if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        return { success: true };
      }
      throw new Error(`Failed to add user: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding user to poll:', error);
    throw error;
  }
};

// Add a date to a poll
export const addDateToPoll = async (pollCode, date, username) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    // Ensure user exists first
    await addUserToPoll(pollCode, username);
    
    // Add the date
    const { error: dateError } = await supabase
      .from('poll_dates')
      .insert([{
        poll_code: pollCode,
        date: date
      }]);
    
    if (dateError && !dateError.message.includes('duplicate key')) {
      throw new Error(`Failed to add date: ${dateError.message}`);
    }
    
    // Set user as available for this date
    const { error: responseError } = await supabase
      .from('poll_responses')
      .insert([{
        poll_code: pollCode,
        date: date,
        username: username,
        available: true
      }]);
    
    if (responseError && !responseError.message.includes('duplicate key')) {
      throw new Error(`Failed to set availability: ${responseError.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding date to poll:', error);
    throw error;
  }
};

// Remove a date from a poll
export const removeDateFromPoll = async (pollCode, date) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    const { error } = await supabase
      .from('poll_dates')
      .delete()
      .eq('poll_code', pollCode)
      .eq('date', date);
    
    if (error) throw new Error(`Failed to remove date: ${error.message}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing date from poll:', error);
    throw error;
  }
};

// Set user availability for a date
export const setUserAvailability = async (pollCode, date, username, available) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    // Ensure user exists
    await addUserToPoll(pollCode, username);
    
    // Upsert the response
    const { error } = await supabase
      .from('poll_responses')
      .upsert([{
        poll_code: pollCode,
        date: date,
        username: username,
        available: available,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'poll_code,date,username'
      });
    
    if (error) throw new Error(`Failed to set availability: ${error.message}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error setting user availability:', error);
    throw error;
  }
};

// Add a comment to a date
export const addCommentToDate = async (pollCode, date, username, comment) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    // Ensure user exists
    await addUserToPoll(pollCode, username);
    
    const { error } = await supabase
      .from('poll_comments')
      .insert([{
        poll_code: pollCode,
        date: date,
        username: username,
        comment: comment
      }]);
    
    if (error) throw new Error(`Failed to add comment: ${error.message}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Verify admin access
export const verifyAdminAccess = async (pollCode, adminToken) => {
  if (pollCode === 'test') return true;
  
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('admin_token')
      .eq('code', pollCode)
      .single();
    
    if (error) return false;
    
    return data.admin_token === adminToken;
  } catch {
    return false;
  }
};

// Get poll admin info
export const getPollAdminInfo = async (pollCode, adminToken) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('code', pollCode)
      .eq('admin_token', adminToken)
      .single();
    
    if (error) throw new Error(`Access denied: ${error.message}`);
    
    // Get counts
    const { count: userCount } = await supabase
      .from('poll_users')
      .select('*', { count: 'exact' })
      .eq('poll_code', pollCode);
    
    const { count: dateCount } = await supabase
      .from('poll_dates')
      .select('*', { count: 'exact' })
      .eq('poll_code', pollCode);
    
    return {
      id: data.id,
      code: data.code,
      title: data.title,
      adminName: data.admin_name,
      adminToken: data.admin_token,
      recoveryEmail: data.recovery_email,
      createdAt: new Date(data.created_at).toLocaleDateString(),
      userCount: userCount || 0,
      dateCount: dateCount || 0
    };
  } catch (error) {
    console.error('Error getting poll admin info:', error);
    throw error;
  }
};

// Test poll data
export const getTestPollData = () => {
  const getNextDays = (count) => {
    const dates = [];
    for (let i = 1; i <= count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const [date1, date2, date3] = getNextDays(3);

  return {
    id: 'test',
    title: 'Team Project Planning',
    creator: 'Admin',
    dates: [
      {
        date: date1,
        participants: [
          { name: 'Alice', available: true },
          { name: 'Bob', available: false },
          { name: 'Charlie', available: true },
          { name: 'David', available: true }
        ],
        comments: [
          { author: 'Alice', text: 'Morning works best for me' },
          { author: 'Bob', text: 'Sorry, I have another meeting' }
        ]
      },
      {
        date: date2,
        participants: [
          { name: 'Alice', available: false },
          { name: 'Bob', available: true },
          { name: 'Charlie', available: true },
          { name: 'David', available: false }
        ],
        comments: [
          { author: 'Bob', text: 'This is perfect for me' }
        ]
      },
      {
        date: date3,
        participants: [
          { name: 'Alice', available: true },
          { name: 'Bob', available: true },
          { name: 'Charlie', available: true },
          { name: 'David', available: true }
        ],
        comments: [
          { author: 'Charlie', text: 'This date works for everyone!' }
        ]
      }
    ],
    users: ['Alice', 'Bob', 'Charlie', 'David'],
    status: 'active'
  };
};
