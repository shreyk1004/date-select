import React, { useState } from 'react';
import { Calendar, PlusCircle, Trash2 } from 'lucide-react';
import './index.css'; 

import './output.css';

function App() {
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
  const [newComment, setNewComment] = useState('');
  const [newDate, setNewDate] = useState('');

  const toggleAvailability = (dateIndex, participantName) => {
    const updatedPoll = {...poll};
    const dateToUpdate = updatedPoll.dates[dateIndex];
    const participant = dateToUpdate.participants.find(p => p.name === participantName);
    
    if (participant) {
      participant.available = !participant.available;
      setPoll(updatedPoll);
    }
  };

  const addComment = (dateIndex) => {
    if (newComment.trim()) {
      const updatedPoll = {...poll};
      updatedPoll.dates[dateIndex].comments.push({
        author: 'Current User', 
        text: newComment
      });
      setPoll(updatedPoll);
      setNewComment('');
    }
  };

  const addNewDate = () => {
    // Check if date already exists
    const dateExists = poll.dates.some(d => d.date === newDate);
    
    if (newDate && !dateExists) {
      const updatedPoll = {...poll};
      updatedPoll.dates.push({
        date: newDate,
        participants: [
          { name: 'Bob', available: false },
          { name: 'Charlie', available: false }
        ],
        comments: []
      });
      setPoll(updatedPoll);
      setNewDate('');
    }
  };

  const deleteDate = (dateIndex) => {
    const updatedPoll = {...poll};
    updatedPoll.dates.splice(dateIndex, 1);
    setPoll(updatedPoll);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center mb-4">
        <Calendar className="mr-2" />
        <h1 className="text-2xl font-bold">{poll.title}</h1>
      </div>
      
      <div className="flex mb-4">
        <input 
          type="date" 
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="flex-grow border rounded p-2 mr-2"
        />
        <button 
          onClick={addNewDate}
          className="bg-green-500 text-white px-3 py-2 rounded flex items-center"
        >
          <PlusCircle className="mr-2" /> Add Date
        </button>
      </div>
      
      <div className="space-y-4">
        {poll.dates.map((dateEntry, index) => (
          <div 
            key={dateEntry.date} 
            className="border rounded p-4 hover:bg-gray-50 transition relative"
          >
            <button 
              onClick={() => deleteDate(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              title="Delete Date"
            >
              <Trash2 />
            </button>

            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">
                {new Date(dateEntry.date).toLocaleDateString()}
              </h2>
              <button 
                className={`px-3 py-1 rounded ${
                  dateEntry.participants.find(p => p.name === 'Bob')?.available 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}
                onClick={() => toggleAvailability(index, 'Bob')}
              >
                {dateEntry.participants.find(p => p.name === 'Bob')?.available 
                  ? 'Available' 
                  : 'Unavailable'}
              </button>
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
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
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
    </div>
  );
}

export default App;