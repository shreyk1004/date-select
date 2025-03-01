import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../services/pollService';
import { CalendarIcon, ClipboardCopy } from 'lucide-react';

function PollCreate() {
  const [title, setTitle] = useState('');
  const [adminName, setAdminName] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState(''); // New recovery email field
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pollCreated, setPollCreated] = useState(false);
  const [pollDetails, setPollDetails] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!title.trim()) {
      setError('Please enter a title for your poll');
      return;
    }

    if (!adminName.trim()) {
      setError('Please enter your name as the poll admin');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create poll in Supabase
      const pollData = await createPoll({ 
        title: title.trim(), 
        adminName: adminName.trim(),
        recoveryEmail: recoveryEmail.trim() // Add recovery email (optional)
      });
      
      // Store the admin info in localStorage for recovery
      localStorage.setItem(`poll_${pollData.code}_admin_token`, pollData.adminToken);
      localStorage.setItem(`poll_${pollData.code}_username`, adminName.trim());
      
      // Set poll created and store poll details
      setPollCreated(true);
      setPollDetails(pollData);
      
    } catch (err) {
      console.error('Error creating poll:', err);
      setError(`Failed to create poll: ${err.message}`);
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const goToAdminPanel = () => {
    navigate(`/poll/${pollDetails.code}/admin`);
  };

  // Render poll creation form if poll not created yet
  if (!pollCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="flex items-center mb-6">
            <CalendarIcon className="mr-2" />
            <h1 className="text-2xl font-bold">Create a New Poll</h1>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Poll Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Team Meeting Schedule"
                className="w-full border rounded p-2"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name (Poll Admin)
              </label>
              <input
                type="text"
                id="adminName"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Enter your name"
                className="w-full border rounded p-2"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="recoveryEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Recovery Email (Optional)
              </label>
              <input
                type="email"
                id="recoveryEmail"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border rounded p-2"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                You can use this email later to recover admin access to your poll.
              </p>
            </div>
            
            <button
              type="submit"
              className={`w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Poll...' : 'Create Poll'}
            </button>
          </form>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              After creating your poll, you'll receive a unique code to share with participants.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render success screen with poll details
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <CalendarIcon className="text-green-500 mr-2" />
          <h1 className="text-2xl font-bold">Poll Created Successfully!</h1>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <p className="text-green-800">
            Your poll has been created. Share the poll code with participants to collect their availability.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Title
            </label>
            <div className="py-2 px-3 bg-gray-50 rounded border">
              {pollDetails.title}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Code
            </label>
            <div className="flex">
              <div className="py-2 px-3 bg-gray-50 rounded-l border-y border-l flex-grow">
                {pollDetails.code}
              </div>
              <button 
                onClick={() => copyToClipboard(pollDetails.code)}
                className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600"
                title="Copy poll code to clipboard"
              >
                <ClipboardCopy size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Token
            </label>
            <div className="flex">
              <div className="py-2 px-3 bg-gray-50 rounded-l border-y border-l flex-grow overflow-auto text-sm">
                {pollDetails.adminToken}
              </div>
              <button 
                onClick={() => copyToClipboard(pollDetails.adminToken)}
                className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600"
                title="Copy admin token to clipboard"
              >
                <ClipboardCopy size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs text-red-500">
              Save this token securely. It's needed to recover admin access to this poll.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Share Link
            </label>
            <div className="flex">
              <div className="py-2 px-3 bg-gray-50 rounded-l border-y border-l flex-grow overflow-auto text-sm">
                {`${window.location.origin}/poll/${pollDetails.code}/join`}
              </div>
              <button 
                onClick={() => copyToClipboard(`${window.location.origin}/poll/${pollDetails.code}/join`)}
                className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600"
                title="Copy share link to clipboard"
              >
                <ClipboardCopy size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={goToAdminPanel}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-6"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PollCreate;
