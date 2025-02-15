import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { usePoll } from '../contexts/PollContext';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

function SamplePoll() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: pollId } = useParams();
  const { getPoll, getPollSession, setPoll } = usePoll();
  const { state } = location;

  // Get admin name from state or fallback to localStorage
  const currentUser = state?.adminName || localStorage.getItem('adminName') || getPollSession('test');

  // Initialize local poll based on state
  const [localPoll, setLocalPoll] = useState(() => {
    if (state?.freshPoll) {
      return {
        title: 'New Poll',
        dates: []
      };
    }
    return state?.isAdmin ? {
      title: state.pollTitle || 'New Poll',
      dates: []
    } : getPoll('test');
  });

  // Prevent redirect to /poll/create when we have admin name
  useEffect(() => {
    if (!currentUser && !state?.isAdmin) {
      navigate('/poll/create');
    }
  }, [currentUser, navigate, state?.isAdmin]);

  // Add debug logging
  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log('State:', state);
  }, [currentUser, state]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [potentialDate, setPotentialDate] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);

  // Update local poll when making changes
  const updatePoll = useCallback((updatedPoll) => {
    setLocalPoll(updatedPoll);
    if (pollId) {  // Only update poll if we have an ID
      setPoll(pollId, updatedPoll);
    }
  }, [setPoll]);  // Remove pollId from dependencies

  useEffect(() => {
    if (!currentUser) {
      navigate(state?.isAdmin ? `/poll/${pollId}/admin` : '/poll/test');
    }
  }, [currentUser, navigate, state?.isAdmin, pollId]);

  // Add click-away listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setPotentialDate(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calendar tile content
  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dateEntry = localPoll.dates.find(d => d.date === dateStr);
    
    if (!dateEntry) return null;

    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    
    return (
      <div className="vote-counter flex flex-col items-center z-10">
        <div className="text-sm font-semibold">{`${availableCount}/${totalCount} available`}</div>
      </div>
    );
  };

  // Tile class names for colors
  const tileClassName = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const dateEntry = localPoll.dates.find(d => d.date === dateStr);
    
    if (!dateEntry) return null;
    
    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    const ratio = availableCount / totalCount;
    
    if (ratio > 0.6) return 'date-green';
    if (ratio >= 0.4) return 'date-yellow';
    return 'date-red';
  };

  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleAddDate = () => {
    const updatedPoll = {...localPoll};
    updatedPoll.dates = [
      ...localPoll.dates,
      {
        date: potentialDate.date,
        participants: [{ name: currentUser, available: true }],
        comments: []
      }
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    updatePoll(updatedPoll);
    setPotentialDate(null);
  };

  const handleDeleteDate = (dateIndex) => {
    const updatedPoll = {...localPoll};
    updatedPoll.dates.splice(dateIndex, 1);
    updatePoll(updatedPoll);
  };

  const handleToggleAvailability = (dateIndex) => {
    const updatedPoll = {...localPoll};
    const dateEntry = updatedPoll.dates[dateIndex];
    const participant = dateEntry.participants.find(p => p.name === currentUser);
    
    if (!participant) {
      // Initial click - set to available
      dateEntry.participants.push({
        name: currentUser,
        available: true
      });
    } else {
      // Toggle between available and unavailable only
      participant.available = !participant.available;
    }
    
    updatePoll(updatedPoll);
  };

  const handleAddComment = useCallback((dateIndex, text) => {
    const updatedPoll = {...localPoll};
    const dateEntry = updatedPoll.dates[dateIndex];
    
    if (!dateEntry.comments) {
      dateEntry.comments = [];
    }
    
    dateEntry.comments.push({
      author: currentUser,
      text: text
    });
    
    updatePoll(updatedPoll);
  }, [localPoll, currentUser, updatePoll]);

  return (
    <div className="max-w-[1400px] mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="mr-2" />
          <h1 className="text-2xl font-bold">{localPoll.title}</h1>
        </div>
        {currentUser && (
          <div className="text-gray-600">
            Logged in as: {currentUser}
          </div>
        )}
      </div>
      
      <div className="flex gap-6">
        {/* Calendar section */}
        <div className="w-[700px] h-[650px] shadow-lg bg-white rounded-lg overflow-hidden">
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
              const dateExists = localPoll.dates.some(d => d.date === formattedDate);
              
              if (!dateExists) {
                const rect = event.target.getBoundingClientRect();
                setPopupPosition({
                  x: rect.right + 10,
                  y: rect.top
                });
                setPotentialDate({
                  date: formattedDate,
                  originalDate: date
                });
              }
            }}
            value={null}
          />
        </div>

        {/* Dates list with interactive features */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Proposed Dates</h2>
            <div className="space-y-6">
              {localPoll.dates.map((dateEntry, index) => (
                <DateEntry
                  key={dateEntry.date}
                  date={dateEntry}
                  dateIndex={index}
                  currentUser={currentUser}
                  onDelete={handleDeleteDate}
                  onToggleAvailability={handleToggleAvailability}
                  onAddComment={handleAddComment}
                />
              ))}
            </div>
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
const DateEntry = memo(({ date, dateIndex, currentUser, onDelete, onToggleAvailability, onAddComment }) => {
  const [commentDraft, setCommentDraft] = useState('');
  const participant = date.participants.find(p => p.name === currentUser);

  const handleCommentSubmit = () => {
    if (commentDraft.trim()) {
      onAddComment(dateIndex, commentDraft);
      setCommentDraft('');
    }
  };

  const getAvailabilityButton = () => {
    if (!participant) {
      return (
        <button 
          onClick={() => onToggleAvailability(dateIndex)}
          className="px-3 py-1 rounded text-sm bg-gray-500 text-white"
        >
          Not Answered
        </button>
      );
    }

    return (
      <button 
        onClick={() => onToggleAvailability(dateIndex)}
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
            onClick={() => onDelete(dateIndex)}
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
