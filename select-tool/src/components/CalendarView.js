import React, { useState } from 'react';
import { Calendar as CalendarIcon, MessageCircle } from 'lucide-react';

function CalendarView({ dates, currentUser, onToggleAvailability, commentDrafts, onAddComment, setCommentDrafts }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = currentMonth.getDay();

  const getDateEntry = (dateString) => {
    return dates.find(d => d.date === dateString);
  };

  const renderCalendarDays = () => {
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Render week days header
    weekDays.forEach(day => {
      days.push(
        <div key={day} className="font-semibold text-center p-2">
          {day}
        </div>
      );
    });

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const dateEntry = getDateEntry(dateString);
      const isProposedDate = dateEntry !== undefined;
      const isAvailable = dateEntry?.participants.find(p => p.name === currentUser)?.available;

      days.push(
        <div
          key={day}
          className={`p-2 border relative min-h-[80px] ${
            isProposedDate 
              ? 'bg-green-50 hover:bg-green-100 cursor-pointer'
              : 'bg-white'
          }`}
          onClick={() => {
            if (isProposedDate) {
              setSelectedDate(dateEntry);
              setShowComments(true);
            }
          }}
        >
          <div className="font-medium">{day}</div>
          {isProposedDate && (
            <>
              <div className={`text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </div>
              {dateEntry.comments.length > 0 && (
                <div className="absolute bottom-1 right-1">
                  <MessageCircle size={16} className="text-blue-500" />
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 border rounded bg-white">
        {renderCalendarDays()}
      </div>

      {showComments && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {new Date(selectedDate.date).toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Participants:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDate.participants.map(participant => (
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
                {selectedDate.comments.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded mb-2">
                    <strong>{comment.author}:</strong> {comment.text}
                  </div>
                ))}
              </div>

              <div className="flex mt-4">
                <input
                  type="text"
                  value={commentDrafts[selectedDate.date] || ''}
                  onChange={(e) => setCommentDrafts(prev => ({
                    ...prev,
                    [selectedDate.date]: e.target.value
                  }))}
                  placeholder="Add a comment"
                  className="flex-grow border rounded p-2 mr-2"
                />
                <button
                  onClick={() => {
                    const dateIndex = dates.findIndex(d => d.date === selectedDate.date);
                    onAddComment(dateIndex);
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
}

export default CalendarView;
