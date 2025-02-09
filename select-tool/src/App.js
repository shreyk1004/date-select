import React, { useState, useMemo, useEffect} from 'react';
import { Calendar as CalendarIcon, PlusCircle, Trash2, List } from 'lucide-react';
import LoginPage from './components/LoginPage';
import Calendar from 'react-calendar';

import './index.css'; 
import './output.css';

import 'react-calendar/dist/Calendar.css';

function App() {
  // Update calendar styles to enforce consistent dimensions
  const calendarStyles = `
    .react-calendar {
      width: 100%;
      max-width: none;
      background: white;
      border: 1px solid #ddd;
      font-family: inherit;
      line-height: 1.125em;
      min-height: 580px; /* Enforce minimum height to accommodate 6 rows */
    }
    .react-calendar__viewContainer {
      padding: 0.5em;
    }
    .react-calendar__tile {
      position: relative;
      height: 80px;
      padding: 1em 0.5em;
      min-height: 80px; /* Enforce consistent tile height */
    }
    .react-calendar__month-view__days__day--weekend {
      color: inherit;
    }
    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
      background-color: #f3f4f6;
    }
    .react-calendar__tile.proposed-date {
      border: 2px solid #10B981;
      background-color: #D1FAE5;
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
  /* 
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [showAddDateModal, setShowAddDateModal] = useState(false); // Add new state for add date modal
  const [newDate, setNewDate] = useState(null); // New state for new date
  */
  const [potentialDate, setPotentialDate] = useState(null); // Add new state for potential date selection
  
  const initialPoll = {
    id: 'unique-poll-id',
    title: 'Team Retreat Planning',
    creator: 'Alice',
    dates: [
      { 
        date: '2025-03-03', 
        participants: [
          { name: 'Bob', available: true },
          { name: 'Charlie', available: false }
        ],
        comments: [
          { author: 'Charlie', text: 'This date conflicts with my conference' }
        ]
      },
      { 
        date: '2025-03-10', 
        participants: [
          { name: 'Bob', available: true },
          { name: 'Charlie', available: true }
        ],
        comments: []
      }
    ]
  };

  const [poll, setPoll] = useState(initialPoll);
  const [commentDrafts, setCommentDrafts] = useState({});  // New state for comment drafts

  const handleLogin = (username) => {
    setCurrentUser(username);
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

  const addComment = (dateString) => {
    const draftComment = commentDrafts[dateString] || '';
    if (draftComment.trim()) {
      const updatedPoll = {...poll};
      const dateIndex = updatedPoll.dates.findIndex(d => d.date === dateString);
      if (dateIndex !== -1) {
        updatedPoll.dates[dateIndex].comments.push({
          author: currentUser,
          text: draftComment
        });
        setPoll(updatedPoll);
        setCommentDrafts(prev => ({
          ...prev,
          [dateString]: ''
        }));
      }
    }
  };

  const handleCommentSubmit = (dateString) => {
    const draftComment = commentDrafts[dateString] || '';
    if (draftComment.trim()) {
      addComment(dateString);
    }
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

  const formatAdjustedDate = (date) => {
    if (!(date instanceof Date)) {
      date = new Date(date); // Ensure it's a Date object
    }
    date.setDate(date.getDate() + 1); // Add 1 day
    return date.toLocaleDateString();
  };
  
  
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

    const isAvailable = dateEntry.participants.find(p => p.name === currentUser)?.available;
    
    return (
      <div className="relative w-full h-full">
        <div className={`absolute inset-0 ${
          isAvailable ? 'bg-green-200' : 'bg-red-200'
        } opacity-50`} />
        {dateEntry.comments.length > 0 && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full mr-1 mb-1" />
        )}
      </div>
    );
  };

  const renderAvailabilityButton = (dateEntry, index) => {
    const participant = dateEntry.participants.find(p => p.name === currentUser);
    if (!participant) {
      return (
        <button 
          className="px-3 py-1 rounded text-sm bg-gray-500 text-white"
          onClick={() => toggleAvailability(index, currentUser)}
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
        onClick={() => toggleAvailability(index, currentUser)}
      >
        {participant.available ? 'Available' : 'Unavailable'}
      </button>
    );
  };

  const renderParticipantBadge = (participant) => {
    let bgColor = 'bg-gray-500'; // Default for not responded
    if (participant) {
      bgColor = participant.available ? 'bg-green-100' : 'bg-red-100';
    }
    return (
      <span 
        key={participant.name}
        className={`px-2 py-1 text-sm rounded ${bgColor}`}
      >
        {participant.name}
      </span>
    );
  };

  const sortedDates = useMemo(() => {
    return [...poll.dates].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [poll.dates]);



  const renderDateSelector = () => (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Calendar section - fixed width */}
      <div className="w-[600px] flex-shrink-0">
        <Calendar
          className="w-full border rounded shadow-sm bg-white"
          defaultValue={defaultCalendarDate}
          tileContent={renderCalendarTile}
          onClickDay={(date) => {
            // Handle date selection consistently
            const formattedDate = formatDateString(date);
            const dateExists = poll.dates.some(d => d.date === formattedDate);
            
            if (!dateExists) {
              setPotentialDate({
                date: formattedDate,
                originalDate: date
              });
            }

            console.log("Formatted date: ", formattedDate)
            console.log("Potential date: ", potentialDate)
          }}
          tileClassName={({ date }) => {
            const dateEntry = getDateEntry(date);
            return dateEntry ? 'proposed-date cursor-not-allowed' : 'cursor-pointer';
          }}
          tileDisabled={({ date }) => {
            const dateEntry = getDateEntry(date);
            return !!dateEntry;
          }}
        />
      </div>

      {/* Dates list section - flexible width */}
      <div className="w-[400px] flex-shrink-0">
        <div className="border rounded-lg bg-white p-4 shadow-sm h-full overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-white">Proposed Dates</h2>
          <div className="space-y-4">
            {sortedDates.map((dateEntry) => {
              const dateIndex = poll.dates.findIndex(d => d.date === dateEntry.date);
              return (
                <div 
                  key={dateEntry.date}
                  className="mb-4 p-3 border rounded hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">
                      {formatAdjustedDate(dateEntry.date)}
                    </h3>
                    <div className="flex gap-2">
                      {renderAvailabilityButton(dateEntry, dateIndex)}
                      <button 
                        onClick={() => deleteDate(dateIndex)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Date"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {dateEntry.participants.map(participant => (
                      renderParticipantBadge(participant)
                    ))}
                  </div>

                  {/* Comments section */}
                  <div className="mt-3">
                    {dateEntry.comments.length > 0 && (
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
                        value={commentDrafts[dateEntry.date] || ''}
                        onChange={(e) => setCommentDrafts(prev => ({
                          ...prev,
                          [dateEntry.date]: e.target.value
                        }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentSubmit(dateEntry.date);
                          }
                        }}
                        placeholder="Add a comment"
                        className="flex-grow border rounded p-1 text-sm mr-2"
                      />
                      <button 
                        onClick={() => handleCommentSubmit(dateEntry.date)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup section - always visible, shows content when needed */}
      <div className="w-[300px] flex-shrink-0">
        {potentialDate && (
          <div className="border rounded-lg bg-white p-4 shadow-lg sticky top-4">
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
        )}
      </div>
    </div>
  );

  // Login check before main render
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Update the main return statement to use fixed max-width
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
      
      {/* Remove the viewMode toggle and list view since it's now integrated */}
    </div>
  );
}

export default App;