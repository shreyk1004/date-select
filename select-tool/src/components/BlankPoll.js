import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ReactCalendar from 'react-calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import DateEntry from './DateEntry';
import 'react-calendar/dist/Calendar.css';

function BlankPoll() {
  const { id: pollId } = useParams();
  const location = useLocation();
  const [currentUser] = useState(location.state?.adminName || 'Anonymous');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popupRef = useRef(null);
  
  // Initialize poll with empty dates array
  const [poll, setPoll] = useState({
    id: pollId,
    title: location.state?.title || 'Untitled Poll',
    creator: currentUser,
    dates: [] // Make sure this is initialized as an empty array
  });

  const [potentialDate, setPotentialDate] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

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
  // Update toggleAvailability to properly handle the state update
  const toggleAvailability = (dateIndex, participantName) => {
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
          available: !dateToUpdate.participants[participantIndex].available
        };
      } else {
        // Add new participant
        dateToUpdate.participants = [
          ...dateToUpdate.participants,
          { name: participantName, available: true }
        ];
      }

      updatedDates[dateIndex] = dateToUpdate;
      
      return {
        ...prevPoll,
        dates: updatedDates
      };
    });
  };

  // Update deleteDate to properly handle the state update
  const deleteDate = (dateIndex) => {
    setPoll(prevPoll => ({
      ...prevPoll,
      dates: prevPoll.dates.filter((_, index) => index !== dateIndex)
    }));
  };

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

  // Calendar tile rendering
  const renderCalendarTile = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateEntry = getDateEntry(date);
    if (!dateEntry) return null;

    const availableCount = dateEntry.participants.filter(p => p.available).length;
    const totalCount = dateEntry.participants.length;
    
    return (
      <div className="vote-counter">
        <div className="text-sm font-semibold">{`${availableCount}/${totalCount} available`}</div>
      </div>
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
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString();
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
        justify-content: center; /* Center content vertically */
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
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

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

      <div className="flex gap-6 justify-center h-[calc(100vh-120px)]">
        {/* Calendar section */}
        <div className="w-[700px] h-[650px] flex-shrink-0 overflow-hidden">
          <ReactCalendar
            className="w-full h-full shadow-lg bg-white"
            defaultValue={defaultCalendarDate}
            tileContent={renderCalendarTile}
            tileClassName={({ date }) => {
              const dateEntry = getDateEntry(date);
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
              const dateExists = poll.dates.some(d => d.date === formattedDate);
              
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
            value={null}
          />

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

        {/* Dates list section */}
        <div className="w-[500px] flex-grow">
          <div className="shadow-lg bg-white p-6 h-full overflow-y-auto rounded-lg">
            <h2 className="text-xl font-semibold mb-8 sticky top-0 bg-white">Proposed Dates</h2>
            <div className="space-y-8">
              {sortedDates.map((dateEntry, index) => (
                <DateEntry
                  key={dateEntry.date}
                  dateEntry={dateEntry}
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
    </div>
  );
}

export default BlankPoll;
