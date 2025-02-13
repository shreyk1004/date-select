import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function AdminPanel() {
  const { id: pollId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPoll, checkAdminToken } = usePoll();
  const [adminToken, setAdminToken] = useState(location.state?.adminToken || '');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  // Add useEffect to auto-verify if admin token is in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken && checkAdminToken(pollId, storedToken)) {
      setAdminToken(storedToken);
      setIsVerified(true);
    }
  }, [pollId, checkAdminToken]);

  const verifyToken = () => {
    if (checkAdminToken(pollId, adminToken)) {
      setIsVerified(true);
      setError('');
      localStorage.setItem('adminToken', adminToken);
    } else {
      setError('Invalid admin token');
    }
  };

  if (!isVerified) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="text"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Enter admin token"
            className="w-full border rounded p-3"
          />
          <button
            onClick={verifyToken}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            Verify Token
          </button>
        </div>
      </div>
    );
  }

  const handleGoToPoll = () => {
    const adminName = localStorage.getItem('adminName');
    console.log("Admin name from storage:", adminName); // Debug log

    if (!adminName) {
      console.log("No admin name found, redirecting to create");
      navigate('/poll/create');
      return;
    }

    console.log("Navigating to blank poll with admin:", adminName); // Debug log
    navigate(`/poll/${pollId}/blank`, { 
      state: { 
        isAdmin: true,
        adminName: adminName,
        pollTitle: 'New Poll',
        freshPoll: true
      },
      replace: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Controls</h1>
        <div className="text-sm text-gray-500">
          Admin Token: {adminToken}
        </div>
      </div>

      <div className="grid gap-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Poll Settings</h2>
          <div className="space-y-4">
            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Close Poll
            </button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
          <div className="space-y-2">
            {currentPoll?.participants?.map(user => (
              <div key={user.name} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <span>{user.name}</span>
                <button className="text-red-500 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manage Dates</h2>
          <div className="space-y-2">
            {currentPoll?.dates?.map(date => (
              <div key={date.date} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <span>{new Date(date.date).toLocaleDateString()}</span>
                <div className="space-x-2">
                  <button className="text-yellow-500 hover:text-yellow-700">Block</button>
                  <button className="text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <button
          onClick={handleGoToPoll}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Go to Poll
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
