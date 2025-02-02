import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, PlusCircle, Trash2, List } from 'lucide-react';
import LoginPage from './components/LoginPage';
import Calendar from 'react-calendar';

import './index.css'; 
import './output.css';

import 'react-calendar/dist/Calendar.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [showAddDateModal, setShowAddDateModal] = useState(false); // Add new state for add date modal
  const [newDate, setNewDate] = useState(null); // New state for new date
  
  const initialPoll = {
    id: 'unique-poll-id',
    title: 'Team Retreat Planning',
    creator: 'Alice',
    dates: [
      { 
        date: '2024-03-03', 
        participants: [
          { name: 'Bob', available: true },
          { name: 'Charlie', available: false }
        ],
        comments: [
          { author: 'Charlie', text: 'This date conflicts with my conference' }
        ]
      },
      { 
        date: '2024-03-10', 
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
    // Get local date parts to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addNewDate = (selectedDate) => {
    // Create a new date at noon to avoid timezone issues
    const date = new Date(selectedDate);
    date.setHours(12);
    
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
              <div>
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
                    placeholder="Add a comment"
                    className="flex-grow border rounded p-2 mr-2"
                  />
                  <button
                    onClick={() => {
                      const dateIndex = poll.dates.findIndex(d => d.date === selectedDateDetails.date);
                      addComment(dateIndex);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddDateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-30">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Select Date</h3>
          <button
            onClick={() => setShowAddDateModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <Calendar
          className="w-full border rounded"
          onClickDay={(date) => addNewDate(date)}
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
    </div>
  );

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
      height: 100px;
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

  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = calendarStyles;
    document.head.appendChild(styleElement);
    return () => styleElement.remove();
  }, []);

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
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

      <div className="flex mb-4 justify-end">
        <div className="relative">
          <Calendar
            value={newDate}
            onChange={(date) => {
              addNewDate(date);
            }}
            className="hidden" // Hide the calendar but keep it functional
          />
          <button 
            onClick={() => document.querySelector('input[name="date"]').click()}
            className="bg-green-500 text-white px-3 py-2 rounded flex items-center"
          >
            <PlusCircle className="mr-2" /> Add Date
          </button>
        </div>
      </div>

      {showAddDateModal && renderAddDateModal()}

      {viewMode === 'calendar' ? renderCalendarView() : (
        <div className="space-y-4">
          {poll.dates.map((dateEntry, index) => (
            <div 
              key={dateEntry.date} 
              className="border rounded p-4 hover:bg-gray-50 transition relative"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">
                  {new Date(dateEntry.date).toLocaleDateString()}
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    className={`px-3 py-1 rounded ${
                      dateEntry.participants.find(p => p.name === currentUser)?.available 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                    onClick={() => toggleAvailability(index, currentUser)}
                  >
                    {dateEntry.participants.find(p => p.name === currentUser)?.available 
                      ? 'Available' 
                      : 'Unavailable'}
                  </button>
                  <button 
                    onClick={() => deleteDate(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Date"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="font-medium">Participants:</h3>
                <div className="flex space-x-2 mb-2">
                  {dateEntry.participants.map(participant => (
                    <span 
                      key={participant.name} 
                      className={`px-2 py-1 rounded ${
                        participant.available 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}
                    >
                      {participant.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <h3 className="font-medium">Comments:</h3>
                {dateEntry.comments.map((comment, commentIndex) => (
                  <div 
                    key={commentIndex} 
                    className="bg-gray-100 p-2 rounded mb-1"
                  >
                    <strong>{comment.author}: </strong>
                    {comment.text}
                  </div>
                ))}
                <div className="flex mt-2">
                  <input 
                    type="text"
                    value={commentDrafts[index] || ''}
                    onChange={(e) => setCommentDrafts(prev => ({
                      ...prev,
                      [index]: e.target.value
                    }))}
                    placeholder="Add a comment"
                    className="flex-grow border rounded p-2 mr-2"
                  />
                  <button 
                    onClick={() => addComment(index)}
                    className="bg-blue-500 text-white px-3 py-2 rounded"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;