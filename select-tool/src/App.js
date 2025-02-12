import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { Calendar as CalendarIcon, PlusCircle, Trash2, List } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CreatePoll from './components/CreatePoll';
import LoginPage from './components/LoginPage';
import Calendar from 'react-calendar';

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
    <div className="p-4 rounded-lg hover:bg-gray-50 border-transparent shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">
          {formatAdjustedDate(dateEntry.date)}
        </h3>
        <div className="flex gap-2">
          {renderAvailabilityButton()}
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
      </div>
    </div>
  );
});

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popupRef = useRef(null);

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
      overflow: hidden; /* Add this */
      border-bottom: 1px solid #ddd; /* Add this */
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
      justify-content: center;  /* Changed from space-between to center */
      align-items: center;
      padding: 0.5em;
      border-right: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      transition: background-color 0.2s;
      min-height: 80px;  /* Added to ensure consistent height */
      overflow: visible; /* Add this */
      z-index: 1; /* Add this */
    }

    /* Add styles for the date number */
    .react-calendar__tile abbr {
      font-weight: bold;  /* Make all dates bold */
      margin-bottom: 0.5em; /* Add some space between date and vote counter */
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
    /* ALSO THIS PART */

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

    /* Trying to fix the variable tiling color as desired  */


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
      pointer-events: auto; /* Enable clicks */
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
      position: absolute;  /* Changed from static */
      bottom: 0.5em;      /* Position at bottom */
      left: 50%;          /* Center horizontally */
      transform: translateX(-50%);
      font-size: 0.75em;
      color: #4B5563;
      background-color: rgba(255, 255, 255, 0.9);
      padding: 2px 6px;
      border-radius: 4px;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1;
      white-space: nowrap;
    }

    .react-calendar__tile:hover .vote-counter {
      opacity: 1;
    }

    /* Remove all .proposed-date related styles as we're not using that class anymore */

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

    /* Make sure the abbr (date number) inherits the color */
    .react-calendar__tile.date-green abbr,
    .react-calendar__tile.date-yellow abbr,
    .react-calendar__tile.date-red abbr {
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
      font-weight: normal;  /* Default weight for all dates */
      margin-bottom: 0.5em;
    }

    /* Add specific style for current month dates */
    .react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--neighboringMonth) abbr {
      font-weight: bold;  /* Bold only for current month dates */
    }

    /* Style for neighboring month dates */
    .react-calendar__month-view__days__day--neighboringMonth abbr {
      color: #9CA3AF;  /* Light gray color for better visual distinction */
    }
  `;

  // Then, use the useEffect hook
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = calendarStyles;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, [calendarStyles]);

  const [currentUser, setCurrentUser] = useState(null);
  const [potentialDate, setPotentialDate] = useState(null); // Add new state for potential date selection
  
  const blankPoll = {
    id: '',
    title: '',
    creator: '',
    dates: []
  };

  const [poll, setPoll] = useState(blankPoll);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleLogin = (username) => {
    setCurrentUser(username);
    // No navigation needed here - it's handled in LoginPage
  };

  const toggleAvailability = (dateIndex, participantName) => {
    const updatedPoll = {...poll};
    const dateToUpdate = updatedPoll.dates[dateIndex];
    const participant = dateToUpdate.participants.find(p => p.name === currentUser);
    
    if (participant) {
      participant.available = !participant.available;
    } else {
      dateToUpdate.participants.push({
        name: currentUser,
        available: true
      });
    }
    setPoll(updatedPoll);
  };

  const defaultCalendarDate = useMemo(() => {
    if (poll.dates.length === 0) return new Date();
    
    const dateGroups = poll.dates.reduce((acc, { date }) => {
      const month = date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const monthWithMostDates = Object.entries(dateGroups)
      .sort(([, a], [, b]) => b - a)[0][0];

    return new Date(monthWithMostDates);
  }, [poll.dates]);

  const formatDateString = (date) => {
    // Ensure we're working with a Date object
    const d = new Date(date);
    // Adjust for local timezone
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (potentialDate && popupRef.current && !popupRef.current.contains(event.target)) {
        // Check if the click is not on a calendar tile
        if (!event.target.closest('.react-calendar__tile')) {
          setPotentialDate(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [potentialDate]);

  const deleteDate = (dateIndex) => {
    setPoll(prevPoll => {
      const updatedPoll = {...prevPoll};
      updatedPoll.dates = [...prevPoll.dates];
      updatedPoll.dates.splice(dateIndex, 1);
      return updatedPoll;
    });
  };

  const getDateEntry = (date) => {
    const formattedDate = formatDateString(date);
    return poll.dates.find(d => d.date === formattedDate);
  };


  const renderCalendarTile = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateEntry = getDateEntry(date);
    if (!dateEntry) return null;
  
    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    
    // Return just the content, Calendar component will handle the container
    return (
      <div className="relative w-full h-full flex flex-col justify-between">
        <div className="vote-counter flex flex-col items-center z-10">
          <div className="text-sm font-semibold">{`${availableCount}/${totalCount} available`}</div>
        </div>
      </div>
    );
  };

  

  const sortedDates = useMemo(() => {
    return [...poll.dates].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [poll.dates]);

  const handleAddComment = useCallback((dateString, text) => {
    setPoll(prevPoll => ({
      ...prevPoll,
      dates: prevPoll.dates.map(date => 
        date.date === dateString
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
  }, [currentUser]);

  const renderDateSelector = () => (
    <div className="flex gap-6 justify-center h-[calc(100vh-88px)]">
      {/* Calendar section */}
      <div className="w-[700px] h-[650px] flex-shrink-0">
        <Calendar
          className="w-full h-full shadow-lg bg-white"
          defaultValue={defaultCalendarDate}
          tileContent={renderCalendarTile}
          tileClassName={({ date }) => {
            const dateEntry = getDateEntry(date);
            if (!dateEntry) return null;
            
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
          value={null} // Add this to prevent auto-selection
        />

        {/* Reposition the popup */}
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
                  onClick={() => {
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
      <div className="w-[500px] flex-grow"> {/* Changed from min/max-width to fixed width */}
        <div className="shadow-lg bg-white p-6 h-full overflow-y-auto rounded-lg"> {/* Removed border, increased padding */}
          <h2 className="text-xl font-semibold mb-8 sticky top-0 bg-white">Proposed Dates</h2> {/* Increased bottom margin */}
          <div className="space-y-8"> {/* Increased gap between date items */}
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
  );

  // Move your current poll view into PollView component
  const PollView = () => {
    const location = useLocation();
    const pollData = location.state?.pollData;
    
    useEffect(() => {
      if (pollData) {
        // Only initialize the poll if it's empty or if it's a new poll
        if (!poll.title || poll.id !== pollData.id) {
          setPoll({
            id: pollData.id,
            title: pollData.title,
            creator: currentUser,
            dates: poll.dates || [] // Preserve existing dates if any
          });
        }
      }
    }, [pollData]); // Remove currentUser from dependencies

    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    if (!poll.title && !pollData) {
      return <Navigate to="/dashboard" />;
    }

    return (
      <div className="max-w-[1400px] mx-auto p-4 min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CalendarIcon className="mr-2" />
            <h1 className="text-2xl font-bold">{poll.title}</h1>
          </div>
          <div className="text-gray-600">
            Logged in as: {currentUser}
          </div>
        </div>
        {renderDateSelector()}
      </div>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Change the root path logic */}
        <Route path="/" element={
          !currentUser ? <Navigate to="/login" /> : <Navigate to="/dashboard" />
        } />
        <Route path="/login" element={
          currentUser ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          !currentUser ? <Navigate to="/login" /> : <LandingPage />
        } />
        <Route path="/create" element={
          !currentUser ? <Navigate to="/login" /> : <CreatePoll />
        } />
        <Route path="/poll/:id" element={
          !currentUser ? <Navigate to="/login" /> : <PollView />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;