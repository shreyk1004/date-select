import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';

function AdminPanel() {
  const { id: pollId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPoll, checkAdminToken } = usePoll();
  const [adminToken, setAdminToken] = useState(location.state?.adminToken || '');
  const [isVerified, setIsVerified] = useState(!!location.state?.isVerified);
  const [error, setError] = useState('');

  // Add useEffect to auto-verify if admin token is in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken && checkAdminToken(pollId, storedToken)) {
      setAdminToken(storedToken);
      setIsVerified(true);
    }
  }, [pollId, checkAdminToken]);

  // Skip verification if we came directly from poll creation
  useEffect(() => {
    if (location.state?.isVerified) {
      setIsVerified(true);
    }
  }, [location.state]);

  const verifyToken = () => {
    if (checkAdminToken(pollId, adminToken)) {
      setIsVerified(true);
      setError('');
      localStorage.setItem('adminToken', adminToken);
    } else {
      setError('Invalid admin token');
    }
  };

  // NEW: Admin Enhancements State
  const [presetNames, setPresetNames] = useState(['John', 'Alice', 'Bob']); // initial presets
  const [newPreset, setNewPreset] = useState('');
  const [blockedDates, setBlockedDates] = useState([]); // list of blocked date strings
  const [selectedBlockDate, setSelectedBlockDate] = useState(null);
  const [pollOpen, setPollOpen] = useState(true);
  const [usageLimit, setUsageLimit] = useState(1);
  const [newParticipant, setNewParticipant] = useState('');

  // Add helper to format a given date string to YYYY-MM-DD format
  function formatDateString(date) {
    const d = new Date(date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  }

  // NEW: Preset Names Management Handlers
  const handleAddPreset = () => {
    const trimmed = newPreset.trim();
    if (trimmed && !presetNames.includes(trimmed)) {
      setPresetNames([...presetNames, trimmed]);
      setNewPreset('');
    }
  };

  const handleRemovePreset = (name) => {
    if(window.confirm(`Remove preset name "${name}"?`)) {
      setPresetNames(presetNames.filter(n => n !== name));
    }
  };

  const handleEditPreset = (oldName, newName) => {
    const trimmed = newName.trim();
    if (trimmed && !presetNames.includes(trimmed)) {
      setPresetNames(presetNames.map(n => (n === oldName ? trimmed : n)));
    }
  };

  // NEW: Date Blocking Controls Handlers
  const handleBlockDate = (date) => {
    const formatted = formatDateString(date);
    if(window.confirm(`Block date ${formatted}?`)) {
      setBlockedDates([...blockedDates, formatted]);
    }
  };

  const handleUnblockDate = (date) => {
    if(window.confirm(`Unblock date ${date}?`)) {
      setBlockedDates(blockedDates.filter(d => d !== date));
    }
  };

  // NEW: Manual User Management Handler
  const handleAddParticipant = () => {
    const trimmed = newParticipant.trim();
    if(trimmed) {
      if(window.confirm(`Add participant "${trimmed}"?`)) {
        // Update currentPoll participants as needed. For demo, you might call a context update.
      }
      setNewParticipant('');
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
    if (!adminName) {
      navigate('/poll/create');
      return;
    }

    navigate(`/poll/${pollId}/blank`, { 
      state: { 
        adminName: adminName,
        isAdmin: true,
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

      {/* NEW: Preset Names Management Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Preset Names Management</h2>
        <div className="mb-4">
          <input
            type="text"
            value={newPreset}
            onChange={(e) => setNewPreset(e.target.value)}
            placeholder="Add new preset name"
            className="border p-2 rounded mr-2"
          />
          <button onClick={handleAddPreset} className="bg-blue-500 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
        <ul>
          {presetNames.map(name => (
            <li key={name} className="flex items-center justify-between border-b p-2">
              <span>{name}</span>
              <div>
                <button
                  onClick={() => {
                    const newName = window.prompt("Edit name:", name);
                    if(newName) handleEditPreset(name, newName);
                  }}
                  className="text-yellow-500 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemovePreset(name)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* NEW: Date Blocking Controls Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Date Blocking Controls</h2>
        <p className="mb-2">Select a date to block/unblock:</p>
        <input
          type="date"
          onChange={(e) => setSelectedBlockDate(new Date(e.target.value))}
          className="border p-2 rounded"
        />
        <button
          onClick={() => selectedBlockDate && handleBlockDate(selectedBlockDate)}
          className="bg-orange-500 text-white px-4 py-2 rounded ml-2"
        >
          Block Date
        </button>
        <ul className="mt-4">
          {blockedDates.map(date => (
            <li key={date} className="flex items-center justify-between p-2 border-b">
              <span>{date}</span>
              <button onClick={() => handleUnblockDate(date)} className="text-green-500">
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* NEW: Results Preview Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Poll Results Preview</h2>
        <div className="p-4 border rounded">
          <p>Total Participants: {currentPoll?.participants?.length || 0}</p>
          <p>Total Dates: {currentPoll?.dates?.length || 0}</p>
          {/* Replace with dynamic chart components if desired */}
        </div>
      </section>

      {/* NEW: Poll Settings Toggles Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Poll Settings</h2>
        <div className="flex items-center mb-4">
          <label className="mr-4">Poll Status:</label>
          <button
            onClick={() => setPollOpen(!pollOpen)}
            className={`px-4 py-2 rounded ${pollOpen ? 'bg-green-500' : 'bg-red-500'} text-white`}
          >
            {pollOpen ? 'Open' : 'Closed'}
          </button>
        </div>
        <div className="flex items-center">
          <label className="mr-4">Preset Usage Limit:</label>
          <input
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(Number(e.target.value))}
            className="border p-2 rounded w-20"
          />
        </div>
      </section>

      {/* NEW: Manual User Management Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Manual User Management</h2>
        <div className="mb-4">
          <input
            type="text"
            value={newParticipant}
            onChange={(e) => setNewParticipant(e.target.value)}
            placeholder="Add participant name"
            className="border p-2 rounded mr-2"
          />
          <button onClick={handleAddParticipant} className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Participant
          </button>
        </div>
        <ul>
          {currentPoll?.participants?.map(user => (
            <li key={user.name} className="flex justify-between items-center p-2 border-b">
              <span>{user.name}</span>
              <button
                onClick={() => {
                  if(window.confirm(`Remove participant "${user.name}"?`)){
                    // Implement removal logic here (e.g., update context)
                  }
                }}
                className="text-red-500"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

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
