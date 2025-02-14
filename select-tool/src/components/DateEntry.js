import React, { useState, memo } from 'react';
import { Trash2 } from 'lucide-react';

const DateEntry = memo(({ 
  dateEntry, 
  dateIndex, 
  onDeleteDate, 
  onToggleAvailability, 
  onAddComment, 
  currentUser 
}) => {
  const [commentDraft, setCommentDraft] = useState('');

  const handleCommentSubmit = () => {
    if (commentDraft.trim()) {
      onAddComment(dateEntry.date, commentDraft);
      setCommentDraft('');
    }
  };

  return (
    <div className="p-4 rounded-lg hover:bg-gray-50 border-transparent shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">
          {new Date(dateEntry.date).toLocaleDateString()}
        </h3>
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 rounded text-sm ${
              dateEntry.participants.find(p => p.name === currentUser)?.available
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
            onClick={() => onToggleAvailability(dateIndex, currentUser)}
          >
            {dateEntry.participants.find(p => p.name === currentUser)?.available
              ? 'Available'
              : 'Unavailable'}
          </button>
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
        {dateEntry.participants.map((participant, i) => (
          <span 
            key={i}
            className={`px-2 py-1 text-sm rounded ${
              participant.available ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {participant.name}
          </span>
        ))}
      </div>

      <div className="mt-3">
        {dateEntry.comments?.length > 0 && (
          <div className="mb-2 space-y-1">
            {dateEntry.comments.map((comment, i) => (
              <div key={i} className="bg-gray-50 p-2 rounded text-sm">
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

export default DateEntry;
