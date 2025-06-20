import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function PollLogin() {
  const { id: pollId } = useParams();
  const navigate = useNavigate();
  const { getPoll, getPollSession, setPollSession, getPollUsers, addUserToPoll } = usePoll();
  const [selectedOption, setSelectedOption] = useState('');
  const [customName, setCustomName] = useState('');
  const [existingUsers, setExistingUsers] = useState([]);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // For test poll, handle specially
        if (pollId === 'test') {
          setExistingUsers(['Alice', 'Bob', 'Charlie', 'David']);
          setLoading(false);
          return;
        }

        // Get poll data to verify it exists
        const poll = await getPoll(pollId);
        
        if (!poll) {
          navigate('/404', { replace: true });
          return;
        }

        // Load existing users
        const users = await getPollUsers(pollId);
        setExistingUsers(users);
        
        // No auto-login - always show the login form
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing poll login:', error);
        navigate('/404', { replace: true });
      }
    };

    initialize();
  }, [pollId, navigate, getPoll, getPollSession, getPollUsers, setPollSession]);

  // Don't render anything while loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading poll...</div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = selectedOption === 'other' ? customName : selectedOption;
    
    console.log('PollLogin handleSubmit:', {
      selectedOption,
      customName,
      finalUsername: username
    });
    
    if (!username.trim()) {
      setWarning('Please enter a username');
      return;
    }

    if (existingUsers.includes(username) && !warning.includes('Continue anyway')) {
      setWarning(`Username "${username}" already exists. Continue anyway?`);
      return;
    }

    setSubmitting(true);
    setWarning('');
    
    try {
      // Add user to poll if new user
      if (!existingUsers.includes(username)) {
        await addUserToPoll(pollId, username);
      }

      // Don't save session - always show login form
      console.log('PollLogin: Navigating with username:', username);

      // Navigate to poll view
      if (pollId === 'test') {
        navigate('/poll/test/entry', {
          state: { username: username }
        });
      } else {
        // Get fresh poll data for navigation
        const poll = await getPoll(pollId);
        navigate(`/poll/${pollId}/entry`, { 
          state: { 
            username: username,
            pollData: poll
          }
        });
      }
    } catch (error) {
      console.error('Error joining poll:', error);
      setWarning('Error joining poll. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Enter Your Name</h1>
        
        {warning && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded">
            {warning}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {existingUsers.map(name => (
              <label key={name} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <input
                  type="radio"
                  name="username"
                  value={name}
                  checked={selectedOption === name}
                  onChange={(e) => {
                    setSelectedOption(e.target.value);
                    setWarning('');
                  }}
                  className="text-blue-500"
                  disabled={submitting}
                />
                <span>{name}</span>
              </label>
            ))}
            
            <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
              <input
                type="radio"
                name="username"
                value="other"
                checked={selectedOption === 'other'}
                onChange={(e) => {
                  setSelectedOption('other');
                  setWarning('');
                }}
                className="text-blue-500"
                disabled={submitting}
              />
              <span>Other</span>
            </label>
          </div>

          {selectedOption === 'other' && (
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setWarning('');
              }}
              placeholder="Enter your name"
              className="w-full border rounded p-3"
              required
              disabled={submitting}
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full px-4 py-3 rounded text-white ${
              submitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {submitting ? 'Joining...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PollLogin;
