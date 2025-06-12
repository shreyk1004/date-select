import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function PollLogin() {
  const { id: pollId } = useParams();
  const navigate = useNavigate();
  const { getPoll, getPollSession, setPollSession, getPollParticipants } = usePoll();
  const [selectedOption, setSelectedOption] = useState('');
  const [customName, setCustomName] = useState('');
  const [existingUsers, setExistingUsers] = useState([]);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('PollLogin: Getting poll for pollId:', pollId);
        const poll = await getPoll(pollId);
        console.log('PollLogin: Got poll result:', poll);
        
        // For test poll, always allow access
        if (pollId === 'test') {
          setExistingUsers(['Alice', 'Bob', 'Charlie', 'David']);
          setLoading(false);
          return;
        }

        if (!poll) {
          console.log('PollLogin: No poll found, redirecting to 404');
          navigate('/404', { replace: true });
          return;
        }
        
        console.log('PollLogin: Poll found, continuing...');

        // Load participants from database
        console.log('PollLogin: Loading participants for pollId:', pollId);
        const participants = await getPollParticipants(pollId);
        console.log('PollLogin: Got participants:', participants);
        setExistingUsers(participants);
        
        const savedUsername = getPollSession(pollId);
        console.log('PollLogin: Saved username:', savedUsername);
        
        if (savedUsername) {
          const targetRoute = pollId === 'test' ? '/poll/test/entry' : `/poll/${pollId}/entry`;
          console.log('PollLogin: Navigating to:', targetRoute);
          navigate(targetRoute, { replace: true });
          return;
        }
        
        console.log('PollLogin: No saved username, showing login form');
        setLoading(false);
      } catch (error) {
        console.error('Error initializing poll login:', error);
        navigate('/404', { replace: true });
      }
    };

    initialize();
  }, [pollId, navigate, getPoll, getPollSession, getPollParticipants]);

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = selectedOption === 'other' ? customName : selectedOption;
    
    if (!username.trim()) return;

    if (existingUsers.includes(username) && !warning) {
      setWarning('This name is already taken. Continue anyway?');
      return;
    }

    setSubmitting(true);
    setWarning('');
    
    try {
      // Create user in Supabase for non-test polls
      if (pollId !== 'test') {
        console.log('PollLogin: Creating user in database:', username);
        const { ensureUserExists } = await import('../services/pollService');
        await ensureUserExists(pollId, username);
        console.log('PollLogin: User created successfully');
      }

      setPollSession(pollId, username);
      // Special handling for test poll
      if (pollId === 'test') {
        navigate('/poll/test/entry');
      } else {
        navigate(`/poll/${pollId}/entry`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
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
