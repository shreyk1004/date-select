import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function LandingPage() {
  const [pollCode, setPollCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { validatePollCode } = usePoll();

  const handleCreatePoll = () => {
    navigate('/poll/create');
  };

  const handlePollCodeSubmit = async (e) => {
    e.preventDefault();
    const code = pollCode.trim();
    
    setIsValidating(true);
    setError('');
    
    try {
      const isValid = await validatePollCode(code);
      if (isValid) {
        // Navigate to the poll login page for this specific poll
        navigate(`/poll/${code}`);
      } else {
        setError('Invalid poll code');
      }
    } catch (error) {
      console.error('Error validating poll code:', error);
      setError('Error validating poll code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRecoverPoll = () => {
    navigate('/poll/recover');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-center mb-6">Poll Hub</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleCreatePoll}
            className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
          >
            Create Poll
          </button>
          
          {/* Remove the "Join Poll" button */}
          
          {/* Poll code input section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-3">Join Existing Poll</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handlePollCodeSubmit} className="space-y-3">
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
                disabled={isValidating}
                className={`w-full px-4 py-3 rounded text-white ${
                  isValidating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isValidating ? 'Validating...' : 'Join'}
              </button>
            </form>
          </div>
          
          <button
            onClick={handleRecoverPoll}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-100 transition mt-4"
          >
            Recover Poll
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
