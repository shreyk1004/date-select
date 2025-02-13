import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateToken } from '../utils/tokens';
import { usePoll } from '../contexts/PollContext';

function PollCreate() {
  const navigate = useNavigate();
  const { setAdminToken } = usePoll();
  const [formData, setFormData] = useState({
    username: '',
    adminToken: generateToken(),
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pollId = `poll-${Date.now()}`;
    
    // Save admin token
    setAdminToken(pollId, formData.adminToken);
    
    // Create poll data
    const pollData = {
      id: pollId,
      creator: formData.username,
      adminToken: formData.adminToken,
      email: formData.email || null,
      created: new Date().toISOString(),
      status: 'active'
    };

    // Navigate to admin view with the token
    navigate(`/poll/${pollId}/admin`, {
      state: { adminToken: formData.adminToken }
    });
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Your Name</label>
          <input
            type="text"
            value={formData.username}
            onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Admin Token</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.adminToken}
              onChange={e => setFormData(prev => ({ ...prev, adminToken: e.target.value }))}
              className="w-full border rounded p-2"
              required
            />
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, adminToken: generateToken() }))}
              className="px-3 py-2 bg-gray-200 rounded"
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-1">Recovery Email (Optional)</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Create Poll
        </button>
      </form>
    </div>
  );
}

export default PollCreate;
