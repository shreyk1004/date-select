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
  const [pollTitle, setPollTitle] = useState(() => 
    localStorage.getItem(`pollTitle_${pollId}`) || ''
  );
  const [titleError, setTitleError] = useState('');  // Add this line
  const [presetNames, setPresetNames] = useState(() => 
    JSON.parse(localStorage.getItem(`presetNames_${pollId}`)) || ['John', 'Alice', 'Bob']
  );
  const [blockedDates, setBlockedDates] = useState(() =>
    JSON.parse(localStorage.getItem(`blockedDates_${pollId}`)) || []
  );
  const [pollOpen, setPollOpen] = useState(() =>
    JSON.parse(localStorage.getItem(`pollOpen_${pollId}`)) ?? true
  );
  const [usageLimit, setUsageLimit] = useState(() =>
    parseInt(localStorage.getItem(`usageLimit_${pollId}`)) || 1
  );
  const [adminName] = useState(localStorage.getItem('adminName') || 'Anonymous');

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
  const [newPreset, setNewPreset] = useState('');
  const [selectedBlockDate, setSelectedBlockDate] = useState(null);

  // Update formatDateString to handle dates consistently
  function formatDateString(date) {
    return date.toISOString().split('T')[0];
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
    if(window.confirm(`Block date ${new Date(formatted + 'T00:00:00').toLocaleDateString()}?`)) {
      setBlockedDates([...blockedDates, formatted]);
    }
  };

  const handleUnblockDate = (date) => {
    if(window.confirm(`Unblock date ${date}?`)) {
      setBlockedDates(blockedDates.filter(d => d !== date));
    }
  };

  // Update useEffect to save title when it changes
  useEffect(() => {
    localStorage.setItem(`pollTitle_${pollId}`, pollTitle);
  }, [pollId, pollTitle]);

  // Add effect to save settings whenever they change
  useEffect(() => {
    localStorage.setItem(`presetNames_${pollId}`, JSON.stringify(presetNames));
    localStorage.setItem(`blockedDates_${pollId}`, JSON.stringify(blockedDates));
    localStorage.setItem(`pollOpen_${pollId}`, JSON.stringify(pollOpen));
    localStorage.setItem(`usageLimit_${pollId}`, usageLimit.toString());
  }, [pollId, presetNames, blockedDates, pollOpen, usageLimit]);

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
    if (!pollTitle.trim()) {
      setTitleError('Please enter a poll title before proceeding');
      return;
    }

    const adminName = localStorage.getItem('adminName');
    if (!adminName) {
      navigate('/poll/create');
      return;
    }

    navigate(`/poll/${pollId}/blank`, { 
      state: { 
        adminName: adminName,
        isAdmin: true,
        freshPoll: true,
        pollTitle: pollTitle,
        pollSettings: {
          presetNames,
          blockedDates,
          pollOpen,
          usageLimit
        }
      },
      replace: true 
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-2xl font-bold">Admin Controls</h1>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">
            Admin Token: {adminToken}
          </div>
          <div className="text-sm text-gray-500">
            Admin: {adminName}
          </div>
        </div>
      </div>

      {/* Poll Title Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Poll Title</h2>
        <div className="space-y-2">
          <input
            type="text"
            value={pollTitle}
            onChange={(e) => {
              setPollTitle(e.target.value);
              setTitleError('');  // Clear error when typing
            }}
            placeholder="Enter poll title"
            className={`w-full border rounded p-2 ${titleError ? 'border-red-500' : ''}`}
          />
          {titleError && (
            <p className="text-red-500 text-sm">{titleError}</p>
          )}
        </div>
      </section>

      {/* Remove Manage Users and Manage Dates sections */}

      {/* Preset Names Management Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
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

      {/* Date Blocking Controls Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Date Blocking</h2>
        <p className="mb-2">Select a date to block/unblock:</p>
        <input
          type="date"
          onChange={(e) => {
            // Use the formatAdjustedDate approach
            const selectedDate = new Date(e.target.value + 'T00:00:00');
            setSelectedBlockDate(selectedDate);
          }}
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
              <span>{new Date(date + 'T00:00:00').toLocaleDateString()}</span>
              <button onClick={() => handleUnblockDate(date)} className="text-green-500">
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Results Preview Section */}
      <section className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Poll Results Preview</h2>
        <div className="p-4 border rounded">
          <p>Total Participants: {currentPoll?.participants?.length || 0}</p>
          <p>Total Dates: {currentPoll?.dates?.length || 0}</p>
          {/* Replace with dynamic chart components if desired */}
        </div>
      </section>

      {/* Poll Settings Toggles Section */}
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

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between items-center">
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Close Poll
        </button>
        
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
