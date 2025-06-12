import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PollRecover() {
  const [pollCode, setPollCode] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real app, this would make an API call to validate poll code and send recovery info
    if (pollCode.trim().length >= 4) { // Mock validation - poll codes are usually 6 chars but allow 4+
      setStatus('success');
      // Mock successful recovery - redirect to home after showing success message
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Recover Admin Access</h1>
        
        <p className="text-gray-600 mb-4">
          Enter your poll code to recover admin access. We'll provide recovery instructions for your poll.
        </p>
        
        {status === 'success' && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Poll found! Recovery instructions will be available soon. Redirecting to home...
          </div>
        )}
        
        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            Invalid poll code. Please check and try again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pollCode" className="block text-sm font-medium text-gray-700 mb-1">
              Poll Code
            </label>
            <input
              id="pollCode"
              type="text"
              value={pollCode}
              onChange={(e) => setPollCode(e.target.value.toUpperCase())}
              placeholder="Enter poll code (e.g. ABCD12)"
              className="w-full border rounded p-3 text-center text-lg font-mono"
              maxLength="8"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Recover Access
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PollRecover;
