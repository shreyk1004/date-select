import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  getPoll, 
  addDateToPoll, 
  removeDateFromPoll, 
  setAvailability, 
  addComment,
  initializeTestPoll 
} from '../services/pollService';

function SamplePoll() {
  // Get all hooks at the top level
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const pollId = id || 'test'; // Define pollId here so it can be used throughout

  // All state hooks must be at the top level
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localPoll, setLocalPoll] = useState({ title: 'Poll', dates: [] });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [potentialDate, setPotentialDate] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDatePopup, setSelectedDatePopup] = useState({ visible: false, position: { x: 0, y: 0 } });
  
  // Refs
  const popupRef = useRef(null);
  const selectedDateRef = useRef(null);

  // Load data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // If this is the test poll, ensure it's initialized first
        if (pollId === 'test') {
          await initializeTestPoll();
        }
        
        // Get username from state or localStorage
        let currentUsername;
        if (location.state?.username) {
          currentUsername = location.state.username;
          setUsername(currentUsername);
        } else {
          // Fall back to localStorage if not in state (e.g., if user refreshed page)
          const storedUsername = localStorage.getItem(`poll_${pollId}_username`);
          
          if (storedUsername) {
            currentUsername = storedUsername;
            setUsername(storedUsername);
          } else {
            // If no username found, redirect to join page
            navigate(`/poll/${pollId}/join`);
            return;
          }
        }

        // Fetch poll data from Supabase
        const pollData = await getPoll(pollId);
        
        setLocalPoll({
          id: pollData.id,
          code: pollData.code,
          title: pollData.title,
          dates: pollData.dates || []
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching poll data:', err);
        
        // Better error messaging for table not found issues
        if (err.message.includes('does not exist')) {
          setError(
            `Database tables are not set up. Please run the SQL migrations in the Supabase SQL Editor. 
            Error details: ${err.message}`
          );
        } else {
          setError(`Error loading poll: ${err.message}`);
        }
        
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pollId, location.state, navigate]);

  // Helper functions
  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatAdjustedDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const getParticipantStatus = (dateEntry) => {
    if (!dateEntry || !dateEntry.participants) return { exists: false, available: null };
    
    const participant = dateEntry.participants.find(p => p.name === username);
    if (!participant) {
      return { exists: false, available: null }; // null means no response yet
    }
    return { exists: true, available: participant.available };
  };

  const isDateInDifferentMonth = (date) => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return date < currentMonthStart || date > currentMonthEnd;
  };

  // Event handlers
  const handleAddDate = async () => {
    if (!potentialDate) return;
    
    try {
      setIsLoading(true);
      
      // Add date to Supabase
      await addDateToPoll(pollId, potentialDate.date, username);
      
      // Refresh the poll data
      const updatedPoll = await getPoll(pollId);
      setLocalPoll(updatedPoll);
      
      setPotentialDate(null);
    } catch (err) {
      console.error('Error adding date:', err);
      setError(`Failed to add date: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDate = async (dateString) => {
    try {
      setIsLoading(true);
      
      // Remove date from Supabase
      await removeDateFromPoll(pollId, dateString);
      
      // Refresh the poll data
      const updatedPoll = await getPoll(pollId);
      setLocalPoll(updatedPoll);
    } catch (err) {
      console.error('Error removing date:', err);
      setError(`Failed to remove date: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async (dateString) => {
    try {
      setIsLoading(true);
      
      const dateEntry = localPoll.dates.find(d => d.date === dateString);
      const userStatus = getParticipantStatus(dateEntry);
      
      // Set availability in Supabase (flip current status or set to true if new)
      const newAvailability = userStatus.exists ? !userStatus.available : true;
      await setAvailability(pollId, dateString, username, newAvailability);
      
      // Refresh the poll data
      const updatedPoll = await getPoll(pollId);
      setLocalPoll(updatedPoll);
    } catch (err) {
      console.error('Error setting availability:', err);
      setError(`Failed to update availability: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (dateString, text) => {
    try {
      setIsLoading(true);
      
      // Add comment to Supabase
      await addComment(pollId, dateString, username, text);
      
      // Refresh the poll data
      const updatedPoll = await getPoll(pollId);
      setLocalPoll(updatedPoll);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(`Failed to add comment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showPopupForDate = (date, event, isExistingDate) => {
    const rect = event.target.getBoundingClientRect();
    const formattedDate = formatDateString(date);
    
    if (isExistingDate) {
      const dateEntry = localPoll.dates.find(d => d.date === formattedDate);
      setSelectedDate(dateEntry);
      setSelectedDatePopup({
        visible: true,
        position: {
          x: rect.right + 10,
          y: rect.top
        }
      });
    } else {
      setPopupPosition({
        x: rect.right + 10,
        y: rect.top
      });
      setPotentialDate({
        date: formattedDate,
        originalDate: date
      });
    }
  };

  // Calendar tile content
  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dateEntry = localPoll.dates.find(d => d.date === dateStr);
    
    if (!dateEntry) return null;

    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    const userStatus = getParticipantStatus(dateEntry);
    
    return (
      <>
        <div className="vote-counter flex flex-col items-center z-10">
          <div className="text-sm font-semibold">{`${availableCount}/${totalCount} available`}</div>
        </div>
        <div 
          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
            userStatus.available === null
              ? 'bg-gray-400'
              : userStatus.available
                ? 'bg-green-500'
                : 'bg-red-500'
          }`}
        />
      </>
    );
  };

  // Tile class names for colors
  const tileClassName = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dateEntry = localPoll.dates.find(d => d.date === dateStr);
    
    if (!dateEntry) return null;
    
    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    const ratio = totalCount > 0 ? availableCount / totalCount : 0;
    
    if (ratio > 0.6) return 'date-green';
    if (ratio >= 0.4) return 'date-yellow';
    return 'date-red';
  };

  // Add click-away listener for potential date popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPotentialDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add click outside handler for the selected date popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectedDateRef.current && !selectedDateRef.current.contains(event.target)) {
        setSelectedDatePopup(prev => ({ ...prev, visible: false }));
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow max-w-lg">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="whitespace-pre-line mb-4">{error}</p>
          
          {error.includes('tables are not set up') && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
              <p className="text-sm font-medium mb-2">Solution:</p>
              <ol className="list-decimal list-inside text-sm">
                <li className="mb-2">Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase dashboard</a></li>
                <li className="mb-2">Navigate to the SQL Editor</li>
                <li className="mb-2">Run the SQL migrations from the <code className="bg-gray-100 px-1 py-0.5 rounded">supabase/migrations</code> folder</li>
              </ol>
            </div>
          )}
          
          <button 
            onClick={() => navigate('/')}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="mr-2" />
          <h1 className="text-2xl font-bold">{localPoll.title}</h1>
        </div>
        <div className="text-gray-600">
          Logged in as: {username}
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* Calendar section */}
        <div className="w-[700px] h-[700px] shadow-lg bg-white rounded-lg overflow-hidden">
          <Calendar
            className="w-full h-full"
            tileContent={tileContent}
            tileClassName={tileClassName}
            defaultValue={new Date()}
            minDetail="month"
            maxDetail="month"
            defaultView="month"
            activeStartDate={currentMonth}
            onActiveStartDateChange={({ activeStartDate }) => setCurrentMonth(activeStartDate)}
            onClickDay={(date, event) => {
              const formattedDate = formatDateString(date);
              const dateEntry = localPoll.dates.find(d => d.date === formattedDate);

              if (isDateInDifferentMonth(date)) {
                // If date is in different month, wait for month transition
                setTimeout(() => {
                  showPopupForDate(date, event, !!dateEntry);
                }, 100); // Small delay to allow month transition
              } else {
                // If date is in current month, show popup immediately
                showPopupForDate(date, event, !!dateEntry);
              }
            }}
            value={null}
            tileDisabled={({ date }) => false} // Allow clicking on all dates
          />

          {/* Add new popup for existing dates */}
          {selectedDatePopup.visible && selectedDate && (
            <div
              ref={selectedDateRef}
              className="date-popup shadow-lg bg-white p-4 rounded-lg"
              style={{
                position: 'fixed',
                left: `${selectedDatePopup.position.x}px`,
                top: `${selectedDatePopup.position.y}px`,
                zIndex: 1000,
                minWidth: '200px'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {new Date(selectedDate.date + 'T00:00:00').toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setSelectedDatePopup(prev => ({ ...prev, visible: false }))}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={() => {
                  handleToggleAvailability(selectedDate.date);
                  setSelectedDatePopup(prev => ({ ...prev, visible: false }));
                }}
                className={`w-full px-4 py-2 rounded text-white ${
                  getParticipantStatus(selectedDate).available === null
                    ? 'bg-gray-500 hover:bg-gray-600'
                    : getParticipantStatus(selectedDate).available
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {getParticipantStatus(selectedDate).available === null
                  ? 'Not Responded'
                  : getParticipantStatus(selectedDate).available
                    ? 'Available'
                    : 'Unavailable'}
              </button>
            </div>
          )}
        </div>

        {/* Dates list with interactive features */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg p-6 h-[700px] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">Proposed Dates</h2>
            {localPoll.dates.length === 0 ? (
              <div className="text-center p-4 bg-gray-50 rounded">
                No dates have been proposed yet. Click on a date in the calendar to add it.
              </div>
            ) : (
              <div className="space-y-6">
                {localPoll.dates.map((dateEntry) => (
                  <DateEntry
                    key={dateEntry.date}
                    date={dateEntry}
                    username={username}
                    onDelete={() => handleDeleteDate(dateEntry.date)}
                    onToggleAvailability={() => handleToggleAvailability(dateEntry.date)}
                    onAddComment={(text) => handleAddComment(dateEntry.date, text)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Date Popup */}
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
                onClick={handleAddDate}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// DateEntry subcomponent
const DateEntry = memo(({ date, username, onDelete, onToggleAvailability, onAddComment }) => {
  const [commentDraft, setCommentDraft] = useState('');
  const participant = date.participants.find(p => p.name === username);

  const handleCommentSubmit = () => {
    if (commentDraft.trim()) {
      onAddComment(commentDraft);
      setCommentDraft('');
    }
  };

  const getAvailabilityButton = () => {
    if (!participant) {
      return (
        <button 
          onClick={onToggleAvailability}
          className="px-3 py-1 rounded text-sm bg-gray-500 text-white"
        >
          Not Answered
        </button>
      );
    }

    return (
      <button 
        onClick={onToggleAvailability}
        className={`px-3 py-1 rounded text-sm ${
          participant.available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}
      >
        {participant.available ? 'Available' : 'Unavailable'}
      </button>
    );
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium">
          {new Date(date.date + 'T00:00:00').toLocaleDateString()}
        </h3>
        <div className="flex gap-2">
          {getAvailabilityButton()}
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Participants */}
        <div className="flex flex-wrap gap-2">
          {date.participants.map(participant => (
            <span
              key={participant.name}
              className={`px-2 py-1 text-sm rounded ${
                participant.available ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {participant.name}
            </span>
          ))}
        </div>

        {/* Comments */}
        {date.comments?.length > 0 && (
          <div className="space-y-2">
            {date.comments.map((comment, i) => (
              <div key={i} className="bg-white p-2 rounded text-sm">
                <strong>{comment.author}:</strong> {comment.text}
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
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
            onClick={handleCommentSubmit}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
});

export default SamplePoll;
