import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      const newPollData = {
        title: title,
        id: 'new-' + Date.now(),
        dates: []
      };
      
      // Use replace instead of navigate to prevent back navigation issues
      navigate(`/poll/${newPollData.id}`, { 
        state: { pollData: newPollData },
        replace: true 
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Poll Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Team Meeting Schedule"
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Poll
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePoll;
