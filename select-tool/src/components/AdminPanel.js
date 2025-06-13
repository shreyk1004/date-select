import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarIcon, ClipboardCopy, Users, Share2, Trash2, UserPlus, Lock, Unlock } from 'lucide-react';
import { usePoll } from '../contexts/PollContext';

function AdminPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPollAdminInfo, addUserToPoll, removeUserFromPoll, getPollUsersWithStats, blockDate, unblockDate, getCompletePollData } = usePoll();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollDetails, setPollDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [dates, setDates] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [userOperationLoading, setUserOperationLoading] = useState(false);
  const [dateOperationLoading, setDateOperationLoading] = useState(false);

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

        // Get poll admin info and user stats in parallel
        const [adminInfo, userStats, pollData] = await Promise.all([
          getPollAdminInfo(id, adminToken),
          getPollUsersWithStats(id),
          getCompletePollData(id)
        ]);
        
        setPollDetails(adminInfo);
        setUsers(userStats);
        setDates(pollData.dates);
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
  }, [id, getPollAdminInfo, getPollUsersWithStats, getCompletePollData]);

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

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    
    setUserOperationLoading(true);
    try {
      await addUserToPoll(id, newUsername.trim());
      
      // Refresh user list
      const updatedUsers = await getPollUsersWithStats(id);
      setUsers(updatedUsers);
      
      // Reset form
      setNewUsername('');
      setShowAddUser(false);
      
      alert(`User "${newUsername.trim()}" added successfully!`);
    } catch (error) {
      console.error('Error adding user:', error);
      alert(`Error adding user: ${error.message}`);
    } finally {
      setUserOperationLoading(false);
    }
  };

  const handleRemoveUser = async (username) => {
    if (window.confirm(`Are you sure you want to remove "${username}"? This will delete all their votes and comments.`)) {
      setUserOperationLoading(true);
      try {
        await removeUserFromPoll(id, username);
        
        // Refresh user list
        const updatedUsers = await getPollUsersWithStats(id);
        setUsers(updatedUsers);
        
        alert(`User "${username}" removed successfully!`);
      } catch (error) {
        console.error('Error removing user:', error);
        alert(`Error removing user: ${error.message}`);
      } finally {
        setUserOperationLoading(false);
      }
    }
  };

  const handleBlockDate = async (date) => {
    if (window.confirm(`Are you sure you want to block the date ${new Date(date).toLocaleDateString()}? Users won't be able to vote or comment on this date.`)) {
      setDateOperationLoading(true);
      try {
        await blockDate(id, date);
        
        // Refresh dates list
        const updatedPollData = await getCompletePollData(id);
        setDates(updatedPollData.dates);
        
        alert(`Date ${new Date(date).toLocaleDateString()} blocked successfully!`);
      } catch (error) {
        console.error('Error blocking date:', error);
        alert(`Error blocking date: ${error.message}`);
      } finally {
        setDateOperationLoading(false);
      }
    }
  };

  const handleUnblockDate = async (date) => {
    setDateOperationLoading(true);
    try {
      await unblockDate(id, date);
      
      // Refresh dates list
      const updatedPollData = await getCompletePollData(id);
      setDates(updatedPollData.dates);
      
      alert(`Date ${new Date(date).toLocaleDateString()} unblocked successfully!`);
    } catch (error) {
      console.error('Error unblocking date:', error);
      alert(`Error unblocking date: ${error.message}`);
    } finally {
      setDateOperationLoading(false);
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

        {/* User Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="mr-2" />
              Manage Users ({users.length})
            </h3>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              disabled={userOperationLoading}
            >
              <UserPlus className="mr-1" size={16} />
              Add User
            </button>
          </div>

          {/* Add User Form */}
          {showAddUser && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <form onSubmit={handleAddUser} className="flex gap-3">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={userOperationLoading}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={userOperationLoading || !newUsername.trim()}
                >
                  {userOperationLoading ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUsername('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  disabled={userOperationLoading}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No users have joined this poll yet.
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{user.username}</span>
                      {user.username === pollDetails?.adminName && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {user.responseCount} votes • {user.commentCount} comments • 
                      Joined {new Date(user.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {user.username !== pollDetails?.adminName && (
                    <button
                      onClick={() => handleRemoveUser(user.username)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      disabled={userOperationLoading}
                      title={`Remove ${user.username}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Date Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <CalendarIcon className="mr-2" />
              Manage Dates ({dates.length})
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="px-3 py-1 border rounded text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBlockDate(e.target.value);
                    e.target.value = ''; // Clear the input
                  }
                }}
                title="Select a date to block"
              />
              <span className="text-sm text-gray-600">Block any date</span>
            </div>
          </div>

          {/* Dates List */}
          <div className="space-y-3">
            {dates.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No dates have been proposed for this poll yet.
              </div>
            ) : (
              dates
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((date) => {
                  const availableCount = date.participants.filter(p => p.available).length;
                  const totalCount = date.participants.length;
                  const availabilityRatio = totalCount > 0 ? availableCount / totalCount : 0;
                  
                  return (
                    <div
                      key={date.date}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        date.blocked ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(date.date).toLocaleDateString()}
                          </span>
                          {date.blocked && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-medium">
                              BLOCKED
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {availableCount}/{totalCount} available ({Math.round(availabilityRatio * 100)}%)
                          {date.comments && date.comments.length > 0 && (
                            <span> • {date.comments.length} comments</span>
                          )}
                          {date.blocked && date.blockedAt && (
                            <span> • Blocked {new Date(date.blockedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {date.blocked ? (
                          <button
                            onClick={() => handleUnblockDate(date.date)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            disabled={dateOperationLoading}
                            title="Unblock this date"
                          >
                            <Unlock size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockDate(date.date)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            disabled={dateOperationLoading}
                            title="Block this date"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
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
