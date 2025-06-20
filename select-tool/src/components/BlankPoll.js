import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ReactCalendar from 'react-calendar';
import { Calendar as CalendarIcon, Settings } from 'lucide-react';
import { usePoll } from '../contexts/PollContext';  // Add this import
import DateEntry from './DateEntry';
import { getCompletePollData, addDateToPoll, removeDateFromPoll, setUserAvailability, addCommentToDate } from '../services/pollService';
import 'react-calendar/dist/Calendar.css';

const AdminButton = ({ pollId, adminToken, pollTitle }) => {  // Add pollTitle prop
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
            title: pollTitle  // Pass the current poll title
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

function BlankPoll() {
  const { id: pollId } = useParams();
  const location = useLocation();
  
  console.log('BlankPoll location.state:', location.state);
  
  const [currentUser] = useState(location.state?.username || location.state?.adminName || 'Anonymous');
  
  console.log('BlankPoll currentUser:', currentUser);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popupRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Update poll initialization to load from Supabase
  const [poll, setPoll] = useState({
    id: pollId,
    title: 'Loading...',
    creator: currentUser,
    dates: []
  });

  // Load poll data from Supabase on mount
  useEffect(() => {
    const loadPollData = async () => {
      try {
        setLoading(true);
        console.log('Loading poll data for:', pollId);
        const pollData = await getCompletePollData(pollId);
        console.log('Loaded poll data:', pollData);
        setPoll(pollData);
        setError(null);
      } catch (err) {
        console.error('Error loading poll data:', err);
        setError('Failed to load poll data');
        // Set fallback data
        setPoll({
          id: pollId,
          title: location.state?.pollTitle || 'Poll',
          creator: currentUser,
          dates: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadPollData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId]); // Only depend on pollId to avoid infinite loops

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading poll...</div>
      </div>
    );
  }

  // Add effect to save title to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(`pollTitle_${pollId}`, poll.title);
  }, [pollId, poll.title]);

  const [potentialDate, setPotentialDate] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDatePopup, setSelectedDatePopup] = useState({ visible: false, position: { x: 0, y: 0 } });
  const selectedDateRef = useRef(null);

  // Add click outside handler for the new popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectedDateRef.current && !selectedDateRef.current.contains(event.target)) {
        setSelectedDatePopup(prev => ({ ...prev, visible: false }));
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add new helper function to get participant status
  const getParticipantStatus = (dateEntry) => {
    const participant = dateEntry.participants.find(p => p.name === currentUser);
    if (!participant) return { exists: false, available: false };
    return { exists: true, available: participant.available };
  };

  // Calendar helper functions
  const formatDateString = (date) => {
    const d = new Date(date);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  const getDateEntry = (date) => {
    const formattedDate = formatDateString(date);
    return poll.dates.find(d => d.date === formattedDate);
  };

  // Date management functions
  // Update toggleAvailability to save to Supabase and update local state
  const toggleAvailability = async (dateIndex, participantName) => {
    try {
      const dateEntry = poll.dates[dateIndex];
      const participant = dateEntry.participants.find(p => p.name === participantName);
      const newAvailable = participant ? !participant.available : true;
      
      console.log('Toggling availability:', { pollId, date: dateEntry.date, participantName, newAvailable });
      
      // Save to Supabase first
      await setUserAvailability(pollId, dateEntry.date, participantName, newAvailable);
      
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

  // Update deleteDate to save to Supabase and update local state
  const deleteDate = async (dateIndex) => {
    try {
      const dateEntry = poll.dates[dateIndex];
      console.log('Deleting date:', { pollId, date: dateEntry.date });
      
      // Save to Supabase first
      await removeDateFromPoll(pollId, dateEntry.date);
      
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

  // Fix the handleAddComment function to save to Supabase and update local state
  const handleAddComment = useCallback(async (dateString, text) => {
    try {
      console.log('Adding comment:', { pollId, date: dateString, user: currentUser, text });
      
      // Save to Supabase first
      await addCommentToDate(pollId, dateString.split('T')[0], currentUser, text);
      
      // Then update local state
      setPoll(prevPoll => ({
        ...prevPoll,
        dates: prevPoll.dates.map(date => 
          // Remove the T00:00:00 from the comparison
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
  }, [pollId, currentUser]);

  // Calendar tile rendering
  const renderCalendarTile = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateEntry = getDateEntry(date);
    if (!dateEntry) return null;

    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    const userStatus = getParticipantStatus(dateEntry);
    
    return (
      <>
        <div className="vote-counter">
          <div className="text-sm font-semibold">{`${availableCount}/${totalCount} available`}</div>
        </div>
        <div 
          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
            userStatus.exists
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

  // Add missing calendar props
  const defaultCalendarDate = useMemo(() => {
    if (poll.dates.length === 0) return new Date();
    const dateGroups = poll.dates.reduce((acc, { date }) => {
      const month = date.substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    const monthWithMostDates = Object.entries(dateGroups)
      .sort(([, a], [, b]) => b - a)[0][0];
    return new Date(monthWithMostDates);
  }, [poll.dates]);

  // Format date properly for display
  const formatAdjustedDate = (date) => {
    return new Date(date + 'T00:00:00').toLocaleDateString();
  };

  // Update the CSS styles for calendar tiles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-calendar__tile {
        position: relative;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-top: 1rem; /* Add space for the indicator */
      }

      .react-calendar__tile abbr {
        position: relative; /* Change from absolute to relative */
        font-weight: bold;
        margin-bottom: 0; /* Remove bottom margin */
      }

      .vote-counter {
        position: absolute;
        bottom: 8px;
        width: 100%;
        text-align: center;
      }

      /* Ensure colored tiles maintain centered dates */
      .react-calendar__tile.date-green abbr,
      .react-calendar__tile.date-yellow abbr,
      .react-calendar__tile.date-red abbr {
        position: relative;
      }

      .react-calendar__tile.date-blocked {
        background-color: #e5e7eb !important;
        cursor: not-allowed !important;
        color: #9ca3af !important;
      }

      .react-calendar__tile.date-blocked:hover {
        background-color: #e5e7eb !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const [blockedDates] = useState(() => 
    JSON.parse(localStorage.getItem(`blockedDates_${pollId}`)) || []
  );

  // Add a helper function to check if a date is in a different month
  const isDateInDifferentMonth = (date) => {
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return date < currentMonthStart || date > currentMonthEnd;
  };

  // Add a function to show popup after month change
  const showPopupForDate = (date, event, isExistingDate) => {
    const rect = event.target.getBoundingClientRect();
    const formattedDate = formatDateString(date);
    
    if (isExistingDate) {
      const dateEntry = poll.dates.find(d => d.date === formattedDate);
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

  return (
    <div className="max-w-[1400px] mx-auto p-4 min-h-screen">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="mr-2" />
          <h1 className="text-2xl font-bold">{poll.title}</h1>
        </div>
        <div className="text-gray-600">
          Logged in as: {currentUser}
        </div>
      </div>

      <div className="flex gap-6 justify-center h-[calc(100vh-120px)]">
        {/* Calendar section */}
        <div className="w-[700px] h-[650px] flex-shrink-0 overflow-hidden">
          <ReactCalendar
            className="w-full h-full shadow-lg bg-white"
            defaultValue={defaultCalendarDate}
            tileContent={renderCalendarTile}
            tileClassName={({ date }) => {
              const dateStr = formatDateString(date);
              const dateEntry = getDateEntry(date);
              const isBlocked = blockedDates.includes(dateStr);
              
              if (isBlocked) return 'date-blocked';
              if (!dateEntry) return null;
              
              const availableCount = dateEntry.participants.filter(p => p.available).length;
              const totalCount = dateEntry.participants.length;
              const ratio = totalCount > 0 ? availableCount / totalCount : 0;
              
              if (ratio > 0.6) return 'date-green';
              if (ratio >= 0.4) return 'date-yellow';
              return 'date-red';
            }}
            onClickDay={(date, event) => {
              const formattedDate = formatDateString(date);
              const dateEntry = poll.dates.find(d => d.date === formattedDate);
              const isBlocked = blockedDates.includes(formattedDate);

              if (isBlocked) return;

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
            tileDisabled={({ date }) => {
              const dateStr = formatDateString(date);
              return blockedDates.includes(dateStr); // Only disable blocked dates
            }}
            allowPartialRange={true}
            minDetail="year"
            maxDetail="month"
            defaultView="month"
            activeStartDate={currentMonth}
            onActiveStartDateChange={({ activeStartDate }) => setCurrentMonth(activeStartDate)}
            value={null}
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
                  const dateIndex = poll.dates.findIndex(d => d.date === selectedDate.date);
                  if (dateIndex !== -1) {
                    toggleAvailability(dateIndex, currentUser);
                    // Update the selected date's participant status immediately
                    setSelectedDate({
                      ...selectedDate,
                      participants: selectedDate.participants.map(p => 
                        p.name === currentUser 
                          ? { ...p, available: !p.available }
                          : p
                      )
                    });
                  }
                }}
                className={`w-full px-4 py-2 rounded text-white ${
                  getParticipantStatus(selectedDate).exists
                    ? getParticipantStatus(selectedDate).available
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
              >
                {getParticipantStatus(selectedDate).exists
                  ? getParticipantStatus(selectedDate).available
                    ? 'Available'
                    : 'Unavailable'
                  : 'Not Responded'}
              </button>
            </div>
          )}

          {/* Date add popup */}
          {potentialDate && (
            <div 
              ref={popupRef}
              className="date-popup shadow-lg bg-white p-4 rounded-lg"
              style={{
                left: `${popupPosition.x}px`,
                top: `${popupPosition.y}px`,
                position: 'fixed',
                zIndex: 1000,
                minWidth: '200px'
              }}
            >
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
                      console.log('Adding date:', { pollId, date: potentialDate.date, user: currentUser });
                      
                      // Save to Supabase first
                      await addDateToPoll(pollId, potentialDate.date, currentUser);
                      
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
          )}
        </div>

        {/* Dates list section */}
        <div className="w-[500px] flex-grow">
          <div className="shadow-lg bg-white p-6 h-full overflow-y-auto rounded-lg">
            <h2 className="text-xl font-semibold mb-8 sticky top-0 bg-white">Proposed Dates</h2>
            <div className="space-y-8">
              {sortedDates.map((dateEntry, index) => (
                <DateEntry
                  key={dateEntry.date}
                  dateEntry={{
                    ...dateEntry,
                    date: dateEntry.date + 'T00:00:00' // Add time component for consistent display
                  }}
                  dateIndex={index}
                  onDeleteDate={deleteDate}
                  onToggleAvailability={toggleAvailability}
                  onAddComment={handleAddComment}
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <AdminButton 
        pollId={pollId} 
        pollTitle={poll.title}  // Pass current poll title
      />
    </div>
  );
}

export default BlankPoll;
