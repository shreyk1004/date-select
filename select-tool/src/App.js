import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { Calendar as CalendarIcon, Trash2, Settings } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import { PollProvider } from './contexts/PollContext';
import { usePoll } from './contexts/PollContext';

// Import all components
import LandingPage from './components/LandingPage';
import PollCreate from './components/PollCreate';

import PollLogin from './components/PollLogin';
import PollRecover from './components/PollRecover';
import AdminPanel from './components/AdminPanel';
import NotFound from './components/NotFound';
import SamplePoll from './components/SamplePoll';

import './index.css'; 
import './output.css';
import 'react-calendar/dist/Calendar.css';

// Move utility functions before the DateEntry component
const formatAdjustedDate = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  date.setDate(date.getDate() + 1);
  return date.toLocaleDateString();
};

const DateEntry = memo(({ 
  dateEntry, 
  dateIndex, 
  onDeleteDate, 
  onToggleAvailability, 
  onAddComment, 
  currentUser 
}) => {
  const [commentDraft, setCommentDraft] = useState('');

  const handleCommentSubmit = useCallback(() => {
    if (commentDraft.trim()) {
      onAddComment(dateEntry.date, commentDraft);
      setCommentDraft('');
    }
  }, [dateEntry.date, commentDraft, onAddComment]);

  // Add local helper functions
  const renderAvailabilityButton = useCallback(() => {
    const participant = dateEntry.participants.find(p => p.name === currentUser);
    if (!participant) {
      return (
        <button 
          className="px-3 py-1 rounded text-sm bg-gray-500 text-white"
          onClick={() => onToggleAvailability(dateIndex, currentUser)}
        >
          Not Responded
        </button>
      );
    }
    return (
      <button 
        className={`px-3 py-1 rounded text-sm ${
          participant.available 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}
        onClick={() => onToggleAvailability(dateIndex, currentUser)}
      >
        {participant.available ? 'Available' : 'Unavailable'}
      </button>
    );
  }, [dateEntry.participants, currentUser, dateIndex, onToggleAvailability]);

  const renderParticipantBadge = useCallback((participant) => {
    let bgColor = participant.available ? 'bg-green-100' : 'bg-red-100';
    return (
      <span 
        key={participant.name}
        className={`px-2 py-1 text-sm rounded ${bgColor}`}
      >
        {participant.name}
      </span>
    );
  }, []);

  return (
    <div className={`p-4 rounded-lg hover:bg-gray-50 border-transparent shadow-sm ${dateEntry.blocked ? 'opacity-70 bg-gray-50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">
            {formatAdjustedDate(dateEntry.date)}
          </h3>
          {dateEntry.blocked && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-medium">
              BLOCKED
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!dateEntry.blocked && renderAvailabilityButton()}
          <button 
            onClick={() => onDeleteDate(dateIndex)}
            className="text-red-500 hover:text-red-700"
            title="Delete Date"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {dateEntry.participants.map(participant => renderParticipantBadge(participant))}
      </div>

      {/* Comments section */}
      <div className="mt-3">
        {dateEntry.comments?.length > 0 && (
          <div className="mb-2 space-y-1">
            {dateEntry.comments.map((comment, commentIndex) => (
              <div key={commentIndex} className="bg-gray-50 p-2 rounded text-sm">
                <strong>{comment.author}:</strong> {comment.text}
              </div>
            ))}
          </div>
        )}
        
        {!dateEntry.blocked && (
          <div className="flex mt-2">
            <input 
              type="text"
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              placeholder="Add a comment"
              className="flex-grow border rounded p-1 text-sm mr-2"
            />
            <button 
              type="button"
              onClick={handleCommentSubmit}
              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
            >
              Post
            </button>
          </div>
        )}
        
        {dateEntry.blocked && (
          <div className="text-sm text-gray-500 italic mt-2">
            Comments and voting disabled for blocked dates
          </div>
        )}
      </div>
    </div>
  );
});

// AdminButton component for accessing admin panel
const AdminButton = ({ pollId, pollTitle }) => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState('');
  const { checkAdminToken } = usePoll();

  const handleAdminAccess = () => {
    if (checkAdminToken(pollId, inputToken)) {
      navigate(`/poll/${pollId}/admin`, {
        state: { 
          adminToken: inputToken, 
          isVerified: true,
          pollData: {
            title: pollTitle
          }
        }
      });
    } else {
      setError('Invalid admin token');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPopup(true)}
        className="fixed bottom-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        title="Admin Settings"
      >
        <Settings className="w-6 h-6 text-gray-600" />
      </button>

      {/* Admin popup overlay */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Admin Access</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <input
              type="text"
              value={inputToken}
              onChange={(e) => {
                setInputToken(e.target.value);
                setError('');
              }}
              placeholder="Enter admin token"
              className="w-full border rounded p-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAccess}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Move PollView component outside of App to avoid closure issues
const PollView = () => {
  const location = useLocation();
  const { id: pollId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use PollContext functions
  const { refreshPoll, addDateToPoll, removeDateFromPoll, setUserAvailability, addCommentToDate } = usePoll();
  
  // User session management
  // eslint-disable-next-line no-unused-vars
  const [currentUser, setCurrentUser] = useState(() => {
    // Try to get user from location state first, then localStorage
    return location.state?.username || 
           localStorage.getItem(`poll_${pollId}_currentUser`) || 
           null;
  });
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popupRef = useRef(null);
  const [potentialDate, setPotentialDate] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  
  // Poll state managed within PollView
  const [poll, setPoll] = useState({
    id: pollId,
    title: 'Loading...',
    creator: '',
    dates: []
  });
  
  console.log('PollView location.state:', location.state);
  console.log('PollView currentUser:', currentUser);

  // Save user session when it changes
  useEffect(() => {
    if (currentUser && pollId) {
      localStorage.setItem(`poll_${pollId}_currentUser`, currentUser);
    }
  }, [currentUser, pollId]);

  // Handle user switching
  const handleSwitchUser = () => {
    // Clear the stored user session
    localStorage.removeItem(`poll_${pollId}_currentUser`);
    // Navigate back to login for this poll
    navigate(`/poll/${pollId}`, { 
      state: { 
        forceLogin: true 
      } 
    });
  };

  // Utility function for logout (can be used later if needed)
  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    localStorage.removeItem(`poll_${pollId}_currentUser`);
    navigate('/');
  };
  
  // Load poll data from Supabase on mount
  useEffect(() => {
    const loadPollData = async () => {
      try {
        setLoading(true);
        console.log('PollView loading poll data for:', pollId);
        const pollData = await refreshPoll(pollId);
        console.log('PollView loaded poll data:', pollData);
        
        if (pollData) {
          setPoll({
            id: pollData.id,
            title: pollData.title,
            creator: pollData.creator,
            dates: pollData.dates
          });
          setError(null);
        } else {
          throw new Error('Poll not found');
        }
      } catch (err) {
        console.error('Error loading poll data:', err);
        setError('Failed to load poll data');
        // Set fallback data
        setPoll({
          id: pollId,
          title: location.state?.pollData?.title || 'Poll',
          creator: currentUser || 'Unknown',
          dates: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadPollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]); // Only depend on pollId to avoid infinite loops

  // CRUD functions for PollView
  const toggleAvailability = async (dateIndex, participantName) => {
    try {
      const dateEntry = poll.dates[dateIndex];
      const participant = dateEntry.participants.find(p => p.name === participantName);
      const newAvailable = participant ? !participant.available : true;
      
      console.log('PollView toggleAvailability:', { pollId: poll.id, date: dateEntry.date, participantName, newAvailable });
      
      // Save to Supabase first
      await setUserAvailability(poll.id, dateEntry.date, participantName, newAvailable);
      
      // Then update local state
      setPoll(prevPoll => {
        const updatedDates = [...prevPoll.dates];
        const dateToUpdate = {...updatedDates[dateIndex]};
        
        if (!dateToUpdate.participants) {
          dateToUpdate.participants = [];
        }

        const participantIndex = dateToUpdate.participants.findIndex(p => p.name === participantName);
        
        if (participantIndex >= 0) {
          // Toggle existing participant
          dateToUpdate.participants = [...dateToUpdate.participants];
          dateToUpdate.participants[participantIndex] = {
            ...dateToUpdate.participants[participantIndex],
            available: newAvailable
          };
        } else {
          // Add new participant
          dateToUpdate.participants = [
            ...dateToUpdate.participants,
            { name: participantName, available: newAvailable }
          ];
        }

        updatedDates[dateIndex] = dateToUpdate;
        
        return {
          ...prevPoll,
          dates: updatedDates
        };
      });
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError('Failed to update availability');
    }
  };

  const deleteDate = async (dateIndex) => {
    try {
      const dateEntry = poll.dates[dateIndex];
      console.log('PollView deleting date:', { pollId: poll.id, date: dateEntry.date });
      
      // Save to Supabase first
      await removeDateFromPoll(poll.id, dateEntry.date);
      
      // Then update local state
      setPoll(prevPoll => ({
        ...prevPoll,
        dates: prevPoll.dates.filter((_, index) => index !== dateIndex)
      }));
    } catch (error) {
      console.error('Error deleting date:', error);
      setError('Failed to delete date');
    }
  };

  const handleAddComment = useCallback(async (dateString, text) => {
    try {
      console.log('PollView adding comment:', { pollId: poll.id, date: dateString, user: currentUser, text });
      
      // Save to Supabase first
      await addCommentToDate(poll.id, dateString.split('T')[0], currentUser, text);
      
      // Then update local state
      setPoll(prevPoll => ({
        ...prevPoll,
        dates: prevPoll.dates.map(date => 
          date.date === dateString.split('T')[0]
            ? {
                ...date,
                comments: [
                  ...(date.comments || []),
                  { author: currentUser, text }
                ]
              }
            : date
        )
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  }, [poll.id, currentUser, addCommentToDate]);

  // Helper functions
  const formatDateString = (date) => {
    const d = new Date(date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  const getDateEntry = (date) => {
    const formattedDate = formatDateString(date);
    return poll.dates.find(d => d.date === formattedDate);
  };

  const formatAdjustedDate = (date) => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString();
  };

  // Helper function to get participant status
  const getParticipantStatus = (dateEntry) => {
    const participant = dateEntry.participants.find(p => p.name === currentUser);
    if (!participant) return { exists: false, available: false };
    return { exists: true, available: participant.available };
  };

  // Calendar tile rendering
  const renderCalendarTile = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateEntry = getDateEntry(date);
    if (!dateEntry) return null;

    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    const userStatus = getParticipantStatus(dateEntry);
    const isBlocked = dateEntry.blocked;
    
    return (
      <>
        <div className="vote-counter">
          <div className="text-xs font-semibold">{`${availableCount}/${totalCount} available`}</div>
          {isBlocked && (
            <div className="text-xs text-red-600 font-medium mt-1">BLOCKED</div>
          )}
        </div>
        <div 
          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
            isBlocked
              ? 'bg-gray-300 border border-red-500'
              : userStatus.exists
                ? userStatus.available
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : 'bg-gray-400'
          }`}
        />
      </>
    );
  };

  // Sort dates
  const sortedDates = useMemo(() => {
    return [...poll.dates].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [poll.dates]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (potentialDate && popupRef.current && !popupRef.current.contains(event.target)) {
        if (!event.target.closest('.react-calendar__tile')) {
          setPotentialDate(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [potentialDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading poll...</div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('No current user found, redirecting to login');
    return <Navigate to={`/poll/${pollId}`} replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={handleSwitchUser}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Back to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-2 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Go to Home"
          >
            <CalendarIcon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{poll.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-600">
            Logged in as: <span className="font-semibold">{currentUser}</span>
          </div>
          <button
            onClick={handleSwitchUser}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Switch to a different user"
          >
            Switch User
          </button>
        </div>
      </div>

      <div className="flex gap-6 justify-center h-[calc(100vh-120px)]">
        {/* Calendar section */}
        <div className="w-[700px] h-[650px] flex-shrink-0 overflow-hidden">
          <Calendar
            className="w-full h-full shadow-lg bg-white"
            tileClassName={({ date }) => {
              const dateEntry = getDateEntry(date);
              if (!dateEntry) return null;
              
              // Check if date is blocked
              if (dateEntry.blocked) return 'date-blocked';
              
              const availableCount = dateEntry.participants.filter(p => p.available).length;
              const totalCount = dateEntry.participants.length;
              const availabilityRatio = totalCount > 0 ? availableCount / totalCount : 0;
              
              if (availabilityRatio > 0.6) return 'date-green';
              if (availabilityRatio >= 0.4) return 'date-yellow';
              return 'date-red';
            }}
            onClickDay={(date, event) => {
              // Handle date selection consistently
              const formattedDate = formatDateString(date);
              const dateExists = poll.dates.some(d => d.date === formattedDate);
              
              if (!dateExists) {
                // Calculate position relative to the clicked tile
                const rect = event.target.getBoundingClientRect();
                setPopupPosition({
                  x: rect.right + 10, // 10px offset from the right edge of the tile
                  y: rect.top
                });
                setPotentialDate({
                  date: formattedDate,
                  originalDate: date
                });
              }
            }}
            tileDisabled={({ date }) => {
              const dateEntry = getDateEntry(date);
              return !!dateEntry;
            }}
            allowPartialRange={true}
            minDetail="year"
            maxDetail="month"
            defaultView="month"
            activeStartDate={currentMonth}
            onActiveStartDateChange={({ activeStartDate }) => setCurrentMonth(activeStartDate)}
            value={null}
            tileContent={renderCalendarTile}
          />

          {/* Add date popup */}
          {potentialDate && (
            <div 
              ref={popupRef}
              className="date-popup"
              style={{
                left: `${popupPosition.x}px`,
                top: `${popupPosition.y}px`,
                position: 'fixed'
              }}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Add {formatAdjustedDate(potentialDate.date)}?
                </h3>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setPotentialDate(null)}
                    className="px-4 py-2 text-gray-600 hover:text-red-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('PollView adding date:', { pollId: poll.id, date: potentialDate.date, user: currentUser });
                        
                        // Save to Supabase first
                        await addDateToPoll(poll.id, potentialDate.date, currentUser);
                        
                        // Then update local state
                        setPoll(prevPoll => ({
                          ...prevPoll,
                          dates: [
                            ...prevPoll.dates,
                            {
                              date: potentialDate.date,
                              participants: [{ name: currentUser, available: true }],
                              comments: []
                            }
                          ].sort((a, b) => new Date(a.date) - new Date(b.date))
                        }));
                        setPotentialDate(null);
                      } catch (error) {
                        console.error('Error adding date:', error);
                        setError('Failed to add date');
                      }
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Add Date
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dates list section */}
        <div className="w-[500px] flex-grow">
          <div className="shadow-lg bg-white p-6 h-full overflow-y-auto rounded-lg">
            <h2 className="text-xl font-semibold mb-8 sticky top-0 bg-white">Proposed Dates</h2>
            <div className="space-y-8">
              {sortedDates.map((dateEntry) => {
                const dateIndex = poll.dates.findIndex(d => d.date === dateEntry.date);
                return (
                  <DateEntry
                    key={dateEntry.date}
                    dateEntry={dateEntry}
                    dateIndex={dateIndex}
                    onDeleteDate={deleteDate}
                    onToggleAvailability={toggleAvailability}
                    onAddComment={handleAddComment}
                    currentUser={currentUser}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <AdminButton 
        pollId={pollId} 
        pollTitle={poll.title}
      />
    </div>
  );
};

function App() {
  const calendarStyles = `
    .react-calendar {
      width: 700px !important; /* Force fixed width */
      background: white;
      border: transparent;
      font-family: inherit;
      line-height: 1.125em;
      height: 650px;
      display: flex;
      flex-direction: column;
      padding: 1em;
    }
    
    /* Customize navigation layout */
    .react-calendar__navigation {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 1em;
      height: 44px;
      position: relative;
    }
    
    .react-calendar__navigation button {
      min-width: 44px;
      background: none;
      font-size: 1em;
      padding: 0;
    }

    /* Hide year navigation buttons */
    .react-calendar__navigation__prev2-button,
    .react-calendar__navigation__next2-button {
      display: none;
    }

    /* Center and style month label */
    .react-calendar__navigation__label {
      font-weight: bold;
      text-align: center;
      text-transform: capitalize;
      pointer-events: none;
      flex: 0 1 auto;
      padding: 0 1em;
      font-size: 1.1em;
    }

    /* Position month navigation buttons */
    .react-calendar__navigation__prev-button,
    .react-calendar__navigation__next-button {
      position: absolute;
    }

    .react-calendar__navigation__prev-button {
      left: 1em;
    }

    .react-calendar__navigation__next-button {
      right: 1em;
    }

    /* Ensure view container takes remaining space */
    .react-calendar__viewContainer {
      flex: 1;
      min-height: 520px;
      width: 100%;
      border: 1px solid #ddd;
    }

    .react-calendar__month-view {
      width: 100%;
      height: 100%;
    }

    /* Force consistent grid layout */
    .react-calendar__month-view__days {
      display: grid !important;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: repeat(6, minmax(80px, 1fr));
      width: 100%;
      aspect-ratio: 7/6;
      overflow: hidden;
      border-bottom: 1px solid #ddd;
    }

    .react-calendar__year-view,
    .react-calendar__decade-view,
    .react-calendar__century-view {
      padding: 0.5em;
    }
    .react-calendar__month-view__weekdays {
      text-align: center;
      text-transform: uppercase;
      font-weight: bold;
      font-size: 0.8em;
    }
    .react-calendar__tile {
      position: relative;
      height: auto !important;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 0.5em;
      border-right: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      transition: background-color 0.2s;
      min-height: 80px;
      overflow: visible;
      z-index: 1;
    }

    /* Add styles for the date number */
    .react-calendar__tile abbr {
      font-weight: bold;
      margin-bottom: 0.5em;
    }

    .react-calendar__month-view__weekdays__weekday {
      padding: 0.5em;
      border-right: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
    }
    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
      background-color: #f3f4f6;
    }

    .react-calendar__tile--now {
      background: inherit;
    }
    .react-calendar__tile--now abbr {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #3b82f6;
      color: white;
    }
    .react-calendar__tile:enabled:hover {
      background-color: #f3f4f6;
      transition: background-color 0.2s;
    }
    .react-calendar__tile:enabled:active,
    .react-calendar__tile:enabled:focus {
      background-color: #e5e7eb;
    }

    /* Navigation styles for different views */
    .react-calendar__navigation {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 1em;
      height: 44px;
      position: relative;
    }
    
    /* Enable month label click in month view */
    .react-calendar__navigation__label {
      font-weight: bold;
      text-align: center;
      text-transform: capitalize;
      flex: 0 1 auto;
      padding: 0 1em;
      font-size: 1.1em;
      pointer-events: auto;
      cursor: pointer;
    }

    /* Hide year buttons only in month view */
    .react-calendar__navigation button.react-calendar__navigation__prev2-button,
    .react-calendar__navigation button.react-calendar__navigation__next2-button {
      display: none;
    }

    /* Show year buttons in year view */
    .react-calendar__year-view .react-calendar__navigation button.react-calendar__navigation__prev2-button,
    .react-calendar__year-view .react-calendar__navigation button.react-calendar__navigation__next2-button {
      display: block;
      position: absolute;
    }

    /* Position navigation buttons */
    .react-calendar__navigation__prev-button,
    .react-calendar__navigation__next-button {
      position: absolute;
    }

    .react-calendar__navigation__prev-button,
    .react-calendar__navigation__prev2-button {
      left: 1em;
    }

    .react-calendar__navigation__next-button,
    .react-calendar__navigation__next2-button {
      right: 1em;
    }

    /* Style month selection view */
    .react-calendar__year-view .react-calendar__tile {
      height: 100px !important;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      font-weight: 500;
      font-size: 1em;
    }

    /* Style current month in year view */
    .react-calendar__year-view .react-calendar__tile--now {
      background: #3b82f6;
      color: white;
      border-radius: 8px;
    }

    .react-calendar__year-view .react-calendar__tile--now:enabled:hover,
    .react-calendar__year-view .react-calendar__tile--now:enabled:focus {
      background: #2563eb;
    }

    /* Remove the previous circle styling for month view */
    .react-calendar__year-view .react-calendar__tile--now::before {
      display: none;
    }

    .react-calendar__year-view .react-calendar__tile--now abbr {
      position: static;
      font-weight: 600;
    }

    /* Hover styles for other months */
    .react-calendar__year-view .react-calendar__tile:enabled:hover,
    .react-calendar__year-view .react-calendar__tile:enabled:focus {
      background-color: #f3f4f6;
      border-radius: 8px;
    }

    /* Add styles for vote counter */
    .vote-counter {
      position: absolute;
      bottom: 0.5em;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65em;
      color: #4B5563;
      background-color: rgba(255, 255, 255, 0.9);
      padding: 2px 5px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1;
      white-space: nowrap;
    }

    .react-calendar__tile:hover .vote-counter {
      opacity: 1;
    }

    /* Add higher specificity for tile backgrounds */
    .react-calendar__tile .bg-green-300 {
      background-color: rgb(134, 239, 172) !important;
    }
    
    .react-calendar__tile .bg-red-300 {
      background-color: rgb(252, 165, 165) !important;
    }

    /* Add styles for colored tiles */
    .react-calendar__tile.date-green {
      background-color: #86efac !important;
      border: 2px solid #22c55e !important;
      color: white !important;
    }
    
    .react-calendar__tile.date-yellow {
      background-color: #fde047 !important;
      border: 2px solid #eab308 !important;
      color: black !important;
    }
    
    .react-calendar__tile.date-red {
      background-color: #fca5a5 !important;
      border: 2px solid #ef4444 !important;
      color: black !important;
    }

    /* Add styles for blocked dates */
    .react-calendar__tile.date-blocked {
      background-color: #f3f4f6 !important;
      border: 2px solid #9ca3af !important;
      color: #6b7280 !important;
      opacity: 0.7;
      position: relative;
    }

    .react-calendar__tile.date-blocked::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 5px,
        rgba(156, 163, 175, 0.3) 5px,
        rgba(156, 163, 175, 0.3) 10px
      );
      pointer-events: none;
      z-index: 1;
    }

    .react-calendar__tile.date-blocked .vote-counter {
      z-index: 2;
      position: relative;
    }

    /* Make sure the abbr (date number) inherits the color */
    .react-calendar__tile.date-green abbr,
    .react-calendar__tile.date-yellow abbr,
    .react-calendar__tile.date-red abbr,
    .react-calendar__tile.date-blocked abbr {
      color: inherit;
    }

    /* Add styles for popup animation */
    @keyframes genieEffect {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .date-popup {
      position: absolute;
      z-index: 50;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      animation: genieEffect 0.2s ease-out;
      border: 1px solid #e5e7eb;
    }

    /* Modify the existing abbr styles to only apply to current month */
    .react-calendar__month-view__days__day abbr {
      font-weight: normal;
      margin-bottom: 0.5em;
    }

    /* Add specific style for current month dates */
    .react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth) abbr {
      font-weight: bold;
    }

    /* Style for neighboring month dates */
    .react-calendar__month-view__days__day--neighboringMonth abbr {
      color: #9CA3AF;
    }
  `;

  // Apply the styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = calendarStyles;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, [calendarStyles]);

  return (
    <PollProvider>
      <BrowserRouter>
        <Routes>
          {/* Main routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/poll/create" element={<PollCreate />} />

          <Route path="/poll/recover" element={<PollRecover />} />
          
          {/* Sample poll route */}
          <Route path="/poll/test/entry" element={<SamplePoll />} />
          
          {/* Poll interaction routes */}
          <Route path="/poll/:id" element={<PollLogin />} />
          <Route path="/poll/:id/entry" element={<PollView />} />
          <Route path="/poll/:id/admin" element={<AdminPanel />} />
          <Route path="/poll/:id/view" element={<SamplePoll />} />
          
          {/* 404 handling */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </BrowserRouter>
    </PollProvider>
  );
}

export default App;