import React, { createContext, useContext, useState } from 'react';

const PollContext = createContext(null);

// Helper to get next 3 days
const getNextThreeDays = () => {
  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    dates.push(localDate.toISOString().split('T')[0]);
  }
  return dates;
};

// Create sample poll with dynamic dates
const [date1, date2, date3] = getNextThreeDays();

const TEST_POLL = {
  id: 'test',
  title: 'Team Project Planning',
  creator: 'Admin',
  dates: [
    {
      date: date1,
      participants: [
        { name: 'Alice', available: true },
        { name: 'Bob', available: false },
        { name: 'Charlie', available: true },
        { name: 'David', available: true }
      ],
      comments: [
        { author: 'Alice', text: 'Morning works best for me' },
        { author: 'Bob', text: 'Sorry, I have another meeting' },
        { author: 'David', text: "I'm flexible on this day" }
      ]
    },
    {
      date: date2,
      participants: [
        { name: 'Alice', available: false },
        { name: 'Bob', available: true },
        { name: 'Charlie', available: true },
        { name: 'David', available: false }
      ],
      comments: [
        { author: 'Bob', text: 'This is perfect for me' },
        { author: 'Alice', text: 'I have a doctor appointment' }
      ]
    },
    {
      date: date3,
      participants: [
        { name: 'Alice', available: true },
        { name: 'Bob', available: true },
        { name: 'Charlie', available: true },
        { name: 'David', available: true }
      ],
      comments: [
        { author: 'Charlie', text: 'This date works for everyone!' },
        { author: 'David', text: 'Perfect, I can prepare the presentation' }
      ]
    }
  ],
  participants: ['Alice', 'Bob', 'Charlie', 'David'],
  status: 'active'
};

export function PollProvider({ children }) {
  const [polls, setPolls] = useState({ test: TEST_POLL });  // Initialize with test poll
  const [userSession, setUserSession] = useState(() => {
    const saved = localStorage.getItem('pollUserSession');
    return saved ? JSON.parse(saved) : {};
  });

  // Add adminTokens state
  const [adminTokens, setAdminTokens] = useState(() => {
    const saved = localStorage.getItem('adminTokens');
    return saved ? JSON.parse(saved) : {};
  });

  const setPollSession = (pollId, username) => {
    setUserSession(prev => {
      const updated = { ...prev, [pollId]: username };
      localStorage.setItem('pollUserSession', JSON.stringify(updated));
      return updated;
    });
  };

  const getPollSession = (pollId) => userSession[pollId];

  const getPollParticipants = async (pollId) => {
    // Mock data for test poll
    if (pollId === 'test') {
      return ['Alice', 'Bob', 'Charlie', 'David'];
    }
    return [];
  };

  // Add or update admin token for a poll
  const setAdminToken = (pollId, token) => {
    setAdminTokens(prev => {
      const updated = { ...prev, [pollId]: token };
      localStorage.setItem('adminTokens', JSON.stringify(updated));
      return updated;
    });
  };

  // Verify admin token for a poll
  const checkAdminToken = (pollId, token) => {
    // Accept any token for test poll
    if (pollId === 'test') {
      return true;
    }
    return adminTokens[pollId] === token;
  };

  const setPoll = (pollId, updatedPoll) => {
    setPolls(prev => ({
      ...prev,
      [pollId]: updatedPoll
    }));
  };

  const getPoll = (pollId) => {
    console.log('Getting poll:', pollId); // Debug log
    console.log('Available polls:', polls); // Debug log
    return pollId === 'test' ? polls.test : polls[pollId];
  };

  const validatePollCode = (pollCode) => {
    console.log('Validating:', pollCode); // Debug log
    return pollCode === 'test' || polls[pollCode];
  };

  return (
    <PollContext.Provider value={{
      polls,
      setPolls,
      getPoll,
      setPoll,  // Add this
      setPollSession,
      getPollSession,
      getPollParticipants,
      setAdminToken,
      checkAdminToken,
      validatePollCode
    }}>
      {children}
    </PollContext.Provider>
  );
}

export const usePoll = () => useContext(PollContext);
