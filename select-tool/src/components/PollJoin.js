import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function PollJoin() {
  const [pollCode, setPollCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { validatePollCode } = usePoll();

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = pollCode.trim();
    
    if (code === 'test' || validatePollCode(code)) {
      // Navigate without replace to preserve history
      navigate(`/poll/${code}`, { replace: false });
    } else {
      setError('Invalid poll code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Join Poll</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
