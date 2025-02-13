import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PollRecover() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // In a real app, this would make an API call
    if (email.includes('@')) { // Mock validation
      setStatus('success');
      // Mock successful recovery
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
        
        {status === 'success' && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Recovery email sent! Please check your inbox.
          </div>
        )}
        
        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            No poll found with this email.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border rounded p-3"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Recover Access
          </button>
        </form>
      </div>
    </div>
  );
}

export default PollRecover;
