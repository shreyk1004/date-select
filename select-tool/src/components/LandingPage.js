import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Team Calendar</h1>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/create')}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Create New Poll
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600"
          >
            View My Polls
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
