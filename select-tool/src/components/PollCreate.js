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

  const handleSubmit = (e) => {
    e.preventDefault();
    const pollId = `poll-${Date.now()}`;
    
    // Save the admin token and name in localStorage
    localStorage.setItem('adminToken', formData.adminToken);
    localStorage.setItem('adminName', formData.username);
    
    // Save to PollContext
    setAdminToken(pollId, formData.adminToken);

    // Navigate directly to admin panel with auto-verification
    navigate(`/poll/${pollId}/admin`, {
      state: {
        pollData: {
          id: pollId,
          creator: formData.username,
          adminKey: formData.adminToken
        },
        adminToken: formData.adminToken,
        isVerified: true
      },
      replace: true
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
