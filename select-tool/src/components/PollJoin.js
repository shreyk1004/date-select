import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';
import { supabase } from '../supabaseClient';

function PollJoin() {
  const { id } = useParams(); // Get poll code from URL if available
  const [pollCode, setPollCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { validatePollCode } = usePoll();

  // Initialize the test poll users if they don't exist already
  useEffect(() => {
    const testUsers = localStorage.getItem('test_poll_users');
    if (!testUsers) {
      localStorage.setItem('test_poll_users', JSON.stringify(['Alice', 'Bob', 'Charlie', 'David']));
    }
    
    // If poll code is passed in URL, set it
    if (id) {
      setPollCode(id);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = pollCode.trim() || id?.trim();
    const user = username.trim();

    if (!code) {
      setError('Please enter a poll code');
      return;
    }

    // Validate poll code and username
    if (!user) {
      setError('Please enter a username');
      return;
    }
    
    try {
      if (code === 'test') {
        // For test poll, we'll just use localStorage to simulate user management
        const existingUsers = JSON.parse(localStorage.getItem('test_poll_users') || '[]');
        const userExists = existingUsers.includes(user);

        if (userExists) {
          const proceed = window.confirm('Username already exists. Continue as this user?');
          if (!proceed) return;
        } else {
          existingUsers.push(user);
          localStorage.setItem('test_poll_users', JSON.stringify(existingUsers));
        }

        // Store username in localStorage for this poll
        localStorage.setItem(`poll_${code}_username`, user);
        
        // Navigate directly to the poll page with the new user
        navigate(`/poll/${code}`, { 
          state: { username: user },
          replace: false 
        });
      } 
      else if (validatePollCode(code)) {
        // Check if username already exists in the poll via Supabase.
        const { data, error: queryError } = await supabase
          .from('poll_users')
          .select('*')
          .eq('poll_code', code)
          .eq('username', user);
        
        if (queryError) {
          console.error('Error checking username:', queryError);
          setError(`Error checking username: ${queryError.message || queryError}`);
          return;
        }
        
        if (data && data.length > 0) {
          const proceed = window.confirm('Username already exists. Continue as this user?');
          if (!proceed) return;
          // If user exists, just navigate to poll
        } else {
          // Create new user for the poll if not exists.
          const { error: createError } = await supabase
            .from('poll_users')
            .insert([{ 
              poll_code: code, 
              username: user,
              created_at: new Date().toISOString()
            }]);
            
          if (createError) {
            console.error('Error creating user:', createError);
            setError(`Error creating user: ${createError.message || createError}`);
            return;
          }
        }
        
        // Store username in localStorage for this poll
        localStorage.setItem(`poll_${code}_username`, user);
        
        // Navigate directly to the poll page
        navigate(`/poll/${code}`, { 
          state: { username: user },
          replace: false 
        });
      } else {
        setError('Invalid poll code');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError(`An unexpected error occurred: ${error.message || error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">
          {id ? `Join Poll: ${id}` : 'Join Poll'}
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!id && (
            <input
              type="text"
              value={pollCode}
              onChange={(e) => {
                setPollCode(e.target.value);
                setError('');
              }}
              placeholder="Enter poll code"
              className="w-full border rounded p-3"
              required
            />
          )}
          
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            placeholder="Enter username"
            className="w-full border rounded p-3"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Join Poll
          </button>
        </form>
      </div>
    </div>
  );
}

export default PollJoin;
