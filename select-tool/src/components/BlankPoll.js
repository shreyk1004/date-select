import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Calendar from 'react-calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';
import { usePoll } from '../contexts/PollContext';

function BlankPoll() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminName = location.state?.adminName || localStorage.getItem('adminName');

  console.log('BlankPoll state:', location.state); // Debug log
  console.log('Admin name:', adminName); // Debug log

  // Only redirect if we have no admin name at all
  useEffect(() => {
    if (!adminName && !location.state?.isAdmin) {
      navigate('/poll/create');
    }
  }, [adminName, navigate, location.state]);

  const [poll, setPoll] = useState({
    title: 'New Poll',
    dates: [],
    participants: []
  });

  const handleDateClick = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    if (!poll.dates.some(d => d.date === formattedDate)) {
      setPoll(prev => ({
        ...prev,
        dates: [
          ...prev.dates,
          {
            date: formattedDate,
            participants: [{ name: adminName, available: true }],
            comments: []
          }
        ].sort((a, b) => new Date(a.date) - new Date(b.date))
      }));
    }
  };

  if (!adminName) return null;

  return (
    <div className="max-w-[1400px] mx-auto p-4 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarIcon className="mr-2" />
          <h1 className="text-2xl font-bold">{poll.title}</h1>
        </div>
        <div className="text-gray-600">
          Logged in as: {adminName}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Calendar */}
        <div className="w-[700px] h-[650px] shadow-lg bg-white rounded-lg overflow-hidden">
          <Calendar
            className="w-full h-full"
            value={null}
            onClickDay={handleDateClick}
            tileContent={null}
            minDetail="month"
            maxDetail="month"
          />
        </div>

        {/* Dates list */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Proposed Dates</h2>
            <div className="space-y-4">
              {poll.dates.map((date, index) => (
                <div key={date.date} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {new Date(date.date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setPoll(prev => ({
                          ...prev,
                          dates: prev.dates.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlankPoll;
