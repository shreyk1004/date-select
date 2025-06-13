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
      .select('date, blocked, blocked_at')
      .eq('poll_code', pollCode)
      .order('date');
    
    console.log('getCompletePollData - Dates query result:', { datesData, datesError });
    
    if (datesError) {
      // If blocked columns don't exist, try without them
      if (datesError.message.includes('blocked')) {
        const { data: fallbackDatesData, error: fallbackError } = await supabase
          .from('poll_dates')
          .select('date')
          .eq('poll_code', pollCode)
          .order('date');
        
        if (fallbackError) throw new Error(`Failed to fetch dates: ${fallbackError.message}`);
        
        // Convert to expected format with blocked = false
        const datesWithBlockedFalse = (fallbackDatesData || []).map(dateObj => ({
          ...dateObj,
          blocked: false,
          blocked_at: null
        }));
        
        // Continue with fallback data
        const dates = datesWithBlockedFalse.map(dateObj => {
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
            comments,
            blocked: false,
            blockedAt: null
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
      } else {
        throw new Error(`Failed to fetch dates: ${datesError.message}`);
      }
    }
    
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
        comments,
        blocked: dateObj.blocked || false,
        blockedAt: dateObj.blocked_at
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

  if (!pollCode || !username) {
    console.error('addUserToPoll called with missing pollCode or username:', { pollCode, username });
    throw new Error('Missing pollCode or username');
  }
  
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

// Block a date (prevents new votes but preserves existing data)
export const blockDate = async (pollCode, date) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    // First, check if the blocked columns exist by trying to query them
    let hasBlockedColumns = true;
    try {
      await supabase
        .from('poll_dates')
        .select('blocked')
        .limit(1);
    } catch (columnCheckError) {
      if (columnCheckError.message.includes('blocked')) {
        hasBlockedColumns = false;
      }
    }
    
    if (!hasBlockedColumns) {
      throw new Error('Database migration required: Please run the SQL script from supabase/add_blocked_dates.sql in your Supabase Dashboard to add blocked date support.');
    }
    
    // Check if the date exists in poll_dates
    const { data: existingDates, error: checkError } = await supabase
      .from('poll_dates')
      .select('date, blocked')
      .eq('poll_code', pollCode)
      .eq('date', date);
    
    if (checkError) {
      throw new Error(`Error checking date: ${checkError.message}`);
    }
    
    console.log('BlockDate - Existing dates found:', existingDates);
    
    if (!existingDates || existingDates.length === 0) {
      // Date doesn't exist, create it as blocked
      console.log('BlockDate - Creating new blocked date');
      const { error: insertError } = await supabase
        .from('poll_dates')
        .insert([{
          poll_code: pollCode,
          date: date,
          blocked: true,
          blocked_at: new Date().toISOString()
        }]);
      
      if (insertError) {
        throw new Error(`Failed to create blocked date: ${insertError.message}`);
      }
      console.log('BlockDate - Successfully created blocked date');
    } else {
      // Date exists, just update it to blocked
      console.log('BlockDate - Updating existing date to blocked');
      const { data: updateData, error: updateError } = await supabase
        .from('poll_dates')
        .update({
          blocked: true,
          blocked_at: new Date().toISOString()
        })
        .eq('poll_code', pollCode)
        .eq('date', date)
        .select();
      
      if (updateError) {
        throw new Error(`Failed to block date: ${updateError.message}`);
      }
      console.log('BlockDate - Update result:', updateData);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error blocking date:', error);
    throw error;
  }
};

// Unblock a date (allows voting again)
export const unblockDate = async (pollCode, date) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    const { error } = await supabase
      .from('poll_dates')
      .update({
        blocked: false,
        blocked_at: null
      })
      .eq('poll_code', pollCode)
      .eq('date', date);
    
    if (error) {
      if (error.message.includes('blocked')) {
        throw new Error('Please run the database migration to add blocked date support. See the SQL script in supabase/add_blocked_dates.sql');
      }
      throw new Error(`Failed to unblock date: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unblocking date:', error);
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
      .select('id, code, title, admin_name, admin_token, created_at, recovery_email')
      .eq('code', pollCode)
      .eq('admin_token', adminToken)
      .single();
    
    if (error) {
      // If recovery_email column doesn't exist, try without it
      if (error.message.includes('recovery_email') || error.message.includes('column')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('polls')
          .select('id, code, title, admin_name, admin_token, created_at')
          .eq('code', pollCode)
          .eq('admin_token', adminToken)
          .single();
        
        if (fallbackError) throw new Error(`Access denied: ${fallbackError.message}`);
        
        // Use fallback data
        return {
          id: fallbackData.id,
          code: fallbackData.code,
          title: fallbackData.title,
          adminName: fallbackData.admin_name,
          adminToken: fallbackData.admin_token,
          recoveryEmail: null, // No recovery email column
          createdAt: new Date(fallbackData.created_at).toLocaleDateString(),
          userCount: 0,
          dateCount: 0
        };
      } else {
        throw new Error(`Access denied: ${error.message}`);
      }
    }
    
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
      recoveryEmail: data.recovery_email || null,
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

// Remove user from poll and clean up all their data
export const removeUserFromPoll = async (pollCode, username) => {
  if (pollCode === 'test') return { success: true };
  
  try {
    // Check if user is the admin
    const { data: poll } = await supabase
      .from('polls')
      .select('admin_name')
      .eq('code', pollCode)
      .single();
    
    if (poll && poll.admin_name === username) {
      throw new Error('Cannot remove the poll creator/admin');
    }
    
    // Remove user's votes/responses
    const { error: responsesError } = await supabase
      .from('poll_responses')
      .delete()
      .eq('poll_code', pollCode)
      .eq('username', username);
    
    if (responsesError) {
      console.error('Error removing user responses:', responsesError);
    }
    
    // Remove user's comments
    const { error: commentsError } = await supabase
      .from('poll_comments')
      .delete()
      .eq('poll_code', pollCode)
      .eq('username', username);
    
    if (commentsError) {
      console.error('Error removing user comments:', commentsError);
    }
    
    // Remove user from poll_users
    const { error: userError } = await supabase
      .from('poll_users')
      .delete()
      .eq('poll_code', pollCode)
      .eq('username', username);
    
    if (userError) {
      throw new Error(`Failed to remove user: ${userError.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error removing user from poll:', error);
    throw error;
  }
};

// Get poll users with participation statistics
export const getPollUsersWithStats = async (pollCode) => {
  if (pollCode === 'test') {
    return [
      { username: 'Alice', responseCount: 5, commentCount: 2, joinedAt: new Date().toISOString() },
      { username: 'Bob', responseCount: 3, commentCount: 1, joinedAt: new Date().toISOString() },
      { username: 'Charlie', responseCount: 4, commentCount: 0, joinedAt: new Date().toISOString() }
    ];
  }
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('poll_users')
      .select('username, created_at')
      .eq('poll_code', pollCode)
      .order('created_at', { ascending: true });
    
    if (usersError) throw new Error(`Failed to get users: ${usersError.message}`);
    
    // Get all responses for this poll
    const { data: responses } = await supabase
      .from('poll_responses')
      .select('username')
      .eq('poll_code', pollCode);
    
    // Get all comments for this poll
    const { data: comments } = await supabase
      .from('poll_comments')
      .select('username')
      .eq('poll_code', pollCode);
    
    // Combine the data
    const usersWithStats = users.map(user => {
      const userResponses = responses?.filter(r => r.username === user.username) || [];
      const userComments = comments?.filter(c => c.username === user.username) || [];
      
      return {
        username: user.username,
        responseCount: userResponses.length,
        commentCount: userComments.length,
        joinedAt: user.created_at
      };
    });
    
    return usersWithStats;
  } catch (error) {
    console.error('Error getting users with stats:', error);
    throw error;
  }
};
