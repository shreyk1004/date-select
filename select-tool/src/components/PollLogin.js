import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function PollLogin() {
  const { id: pollId } = useParams();
  const navigate = useNavigate();
  const { getPoll, getPollSession, setPollSession } = usePoll();
  const [selectedOption, setSelectedOption] = useState('');
  const [customName, setCustomName] = useState('');
  const [existingUsers, setExistingUsers] = useState([]);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const poll = getPoll(pollId);
      
      // For test poll, always allow access
      if (pollId === 'test') {
        setExistingUsers(['Alice', 'Bob', 'Charlie', 'David']);
        setLoading(false);
        return;
      }

      if (!poll) {
        navigate('/404', { replace: true });
        return;
      }

      // Check for saved session after setting users
      setExistingUsers(poll.participants || []);
      const savedUsername = getPollSession(pollId);
      
      if (savedUsername) {
        navigate(pollId === 'test' ? '/poll/test/entry' : `/poll/${pollId}/entry`, { replace: true });
        return;
      }
      
      setLoading(false);
    };

    initialize();
  }, [pollId, navigate, getPoll, getPollSession]);

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = selectedOption === 'other' ? customName : selectedOption;
    
    if (!username.trim()) return;

    if (existingUsers.includes(username) && !warning) {
      setWarning('This name is already taken. Continue anyway?');
      return;
    }

    setPollSession(pollId, username);
    // Special handling for test poll
    if (pollId === 'test') {
      navigate('/poll/test/entry');
    } else {
      navigate(`/poll/${pollId}/entry`);
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
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default PollLogin;
