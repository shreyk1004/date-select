import React from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 flex items-center justify-center gap-1">
          Poll
          <span className="bg-orange-500 text-black px-2.5 py-1 rounded-md">
            hub
          </span>
        </h1>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/poll/create')}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Create New Poll
          </button>
          <button
            onClick={() => navigate('/poll/join')}
            className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600"
          >
            Join Poll
          </button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
