import React, { useState, useMemo, useEffect} from 'react';
import { Calendar as CalendarIcon, PlusCircle, Trash2, List } from 'lucide-react';
import LoginPage from './components/LoginPage';
import Calendar from 'react-calendar';

import './index.css'; 
import './output.css';

import 'react-calendar/dist/Calendar.css';

function App() {
  // First, define calendarStyles
  const calendarStyles = `
    .react-calendar {
      width: 100%;
      max-width: none;
      background: white;
      border: 1px solid #ddd;
      font-family: inherit;
      line-height: 1.125em;
    }
    .react-calendar__tile {
      position: relative;
      height: 80px;
      padding: 1em 0.5em;
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [showAddDateModal, setShowAddDateModal] = useState(false); // Add new state for add date modal
  const [newDate, setNewDate] = useState(null); // New state for new date
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

  const addComment = (dateIndex) => {
    const draftComment = commentDrafts[dateIndex] || '';
    if (draftComment.trim()) {
      const updatedPoll = {...poll};
      updatedPoll.dates[dateIndex].comments.push({
        author: currentUser,
        text: draftComment
      });
      setPoll(updatedPoll);
      // Clear only this date's comment draft
      setCommentDrafts(prev => ({
        ...prev,
        [dateIndex]: ''
      }));
    }
  };

  const handleCommentSubmit = (dateIndex) => {
    const draftComment = commentDrafts[dateIndex] || '';
    if (draftComment.trim()) {
      addComment(dateIndex);
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
    const correctedDate = new Date(date);
    correctedDate.setDate(correctedDate.getDate() + 1);
    return correctedDate.toISOString().split('T')[0];
  };
  
  const addNewDate = (selectedDate) => {
    // Create date object explicitly in UTC
    const date = new Date(Date.UTC(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    ));
  
    const formattedDate = formatDateString(date);
    const dateExists = poll.dates.some(d => d.date === formattedDate);
    
    if (!dateExists) {
      const updatedPoll = {...poll};
      updatedPoll.dates.push({
        date: formattedDate,
        participants: [{ name: currentUser, available: true }],
        comments: []
      });
      setPoll(updatedPoll);
      setNewDate(null);
    }
  };

  const deleteDate = (dateIndex) => {
    const updatedPoll = {...poll};
    updatedPoll.dates.splice(dateIndex, 1);
    setPoll(updatedPoll);
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

  const renderCalendarView = () => (
    <div className="relative">
      <Calendar
        defaultValue={defaultCalendarDate}
        tileContent={renderCalendarTile}
        className="w-full border rounded"
        tileClassName={({ date }) => {
          const dateEntry = getDateEntry(date);
          return dateEntry 
            ? 'proposed-date cursor-pointer' 
            : '';
        }}
        onClickDay={(date) => {
          const dateEntry = getDateEntry(date);
          if (dateEntry) {
            setSelectedDateDetails(dateEntry);
          }
        }}
      />
      
      {/* Hover preview at bottom of screen */}
      {hoveredDate && !selectedDateDetails && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-96 bg-white border rounded-lg shadow-lg p-4 z-10">
          <h3 className="font-bold mb-2">
            {new Date(hoveredDate.date).toLocaleDateString()}
          </h3>
          <div className="text-sm">
            <strong>Participants:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {hoveredDate.participants.map(p => (
                <span key={p.name} 
                  className={`px-2 py-1 rounded text-xs ${
                    p.available ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clicked date details modal */}
      {selectedDateDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {new Date(selectedDateDetails.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => setSelectedDateDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div></div>
                <h4 className="font-medium mb-2">Participants:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDateDetails.participants.map(participant => (
                    <span
                      key={participant.name}
                      className={`px-2 py-1 rounded text-sm ${
                        participant.available ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {participant.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Comments:</h4>
                {selectedDateDetails.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded mb-2">
                    <strong>{comment.author}:</strong> {comment.text}
                  </div>
                ))}
                
                <div className="flex mt-4">
                  <input
                    type="text"
                    value={commentDrafts[selectedDateDetails.date] || ''}
                    onChange={(e) => setCommentDrafts(prev => ({
                      ...prev,
                      [selectedDateDetails.date]: e.target.value
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const dateIndex = poll.dates.findIndex(d => d.date === selectedDateDetails.date);
                        handleCommentSubmit(dateIndex);
                      }
                    }}
                    placeholder="Add a comment"
                    className="flex-grow border rounded p-2 mr-2"
                  />
                  <button
                    onClick={() => {
                      const dateIndex = poll.dates.findIndex(d => d.date === selectedDateDetails.date);
                      handleCommentSubmit(dateIndex);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );

  const renderDateSelector = () => (
    <div className="flex gap-6">
      {/* Left side - Calendar */}
      <div className="w-2/3">
        <Calendar
          className="w-full border rounded"
          onClickDay={(date) => {
            const formattedDate = formatDateString(date);
            const dateExists = poll.dates.some(d => d.date === formattedDate);
            if (!dateExists) {
              setPotentialDate({ date: formattedDate, originalDate: date });
            }
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

      {/* Right side - Scrolling dates list */}
      <div className="w-1/3 border rounded-lg bg-white p-4">
        <h2 className="text-lg font-semibold mb-4">Proposed Dates</h2>
        <div className="max-h-[600px] overflow-y-auto">
          {poll.dates.map((dateEntry, index) => (
            <div 
              key={dateEntry.date}
              className="mb-4 p-3 border rounded hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">
                  {new Date(dateEntry.date).toLocaleDateString()}
                </h3>
                <button 
                  onClick={() => deleteDate(index)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete Date"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {dateEntry.participants.map(participant => (
                  <span 
                    key={participant.name}
                    className={`px-2 py-1 text-sm rounded ${
                      participant.available 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}
                  >
                    {participant.name}
                  </span>
                ))}
              </div>
              {dateEntry.comments.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {dateEntry.comments.length} comment(s)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keep the confirmation popup */}
      {potentialDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add {new Date(potentialDate.date).toLocaleDateString()}?
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
                  const updatedPoll = {...poll};
                  updatedPoll.dates.push({
                    date: potentialDate.date,
                    participants: [{ name: currentUser, available: true }],
                    comments: []
                  });
                  setPoll(updatedPoll);
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
  );

  // Login check before main render
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Update the main return statement to use full width
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="mr-2" />
          <h1 className="text-2xl font-bold">{poll.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-gray-600">
            Logged in as: {currentUser}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              title="List View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              title="Calendar View"
            >
              <CalendarIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {renderDateSelector()}
      
      {/* Remove the viewMode toggle and list view since it's now integrated */}
    </div>
  );
}

export default App;