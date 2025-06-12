import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarIcon, ClipboardCopy, Users, Share2 } from 'lucide-react';
import { usePoll } from '../contexts/PollContext';

function AdminPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPollAdminInfo } = usePoll();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollDetails, setPollDetails] = useState(null);

  useEffect(() => {
    const fetchPollDetails = async () => {
      setIsLoading(true);
      
      try {
        // Check if admin token exists for this poll
        const adminToken = localStorage.getItem(`poll_${id}_admin_token`);
        
        if (!adminToken) {
          setError("You don't have admin access to this poll");
          setIsLoading(false);
          return;
        }

        // Get poll admin info
        const adminInfo = await getPollAdminInfo(id, adminToken);
        setPollDetails(adminInfo);
        setIsLoading(false);
        
      } catch (err) {
        console.error('Error fetching poll details:', err);
        setError(err.message || 'Error loading poll details');
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPollDetails();
    } else {
      setError("No poll ID provided");
      setIsLoading(false);
    }
  }, [id, getPollAdminInfo]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const handleViewPoll = () => {
    if (pollDetails) {
      navigate(`/poll/${id}/entry`, { 
        state: { 
          username: pollDetails.adminName,
          pollData: {
            id: id,
            title: pollDetails.title
          }
        } 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold mb-4">Access Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <CalendarIcon className="mr-2" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        {/* Poll Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{pollDetails.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
              <Users className="text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-blue-700">Participants</p>
                <p className="text-2xl font-bold">{pollDetails.userCount}</p>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg flex items-center">
              <CalendarIcon className="text-green-500 mr-3" />
              <div>
                <p className="text-sm text-green-700">Proposed Dates</p>
                <p className="text-2xl font-bold">{pollDetails.dateCount}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Admin:</span>
              <span className="font-medium">{pollDetails.adminName}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Created:</span>
              <span>{pollDetails.createdAt}</span>
            </div>
            
            {pollDetails.recoveryEmail && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Recovery Email:</span>
                <span>{pollDetails.recoveryEmail}</span>
              </div>
            )}
            
            <div className="border-t my-4"></div>

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
                Share Link
              </label>
              <div className="flex">
                <div className="py-2 px-3 bg-gray-50 rounded-l border-y border-l flex-grow overflow-auto text-sm">
                  {`${window.location.origin}/poll/${pollDetails.code}`}
                </div>
                <button 
                  onClick={() => copyToClipboard(`${window.location.origin}/poll/${pollDetails.code}`)}
                  className="bg-blue-500 text-white px-3 rounded-r hover:bg-blue-600"
                  title="Copy share link to clipboard"
                >
                  <ClipboardCopy size={16} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Token <span className="text-red-500">(Keep this secure)</span>
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
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleViewPoll}
            className="flex items-center justify-center bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
          >
            <CalendarIcon className="mr-2" size={20} />
            View Poll
          </button>
          
          <button
            onClick={() => copyToClipboard(`${window.location.origin}/poll/${pollDetails.code}`)}
            className="flex items-center justify-center bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600"
          >
            <Share2 className="mr-2" size={20} />
            Share Poll
          </button>
        </div>

        {/* Future Features Section */}
        <div className="mt-8 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Poll closing and results</li>
            <li>Email notifications</li>
            <li>Custom poll settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
