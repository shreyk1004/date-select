import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../supabaseClient';

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
    
    // Get participants from Supabase
    try {
      console.log('getPollParticipants: Querying for pollId:', pollId);
      const { data, error } = await supabase
        .from('poll_users')
        .select('username')
        .eq('poll_code', pollId);
      
      console.log('getPollParticipants result:', { data, error });
      
      if (error) {
        console.error('Error getting poll participants:', error);
        return [];
      }
      
      return data ? data.map(user => user.username) : [];
    } catch (err) {
      console.error('Error getting poll participants:', err);
      return [];
    }
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

  const getPoll = async (pollId) => {
    console.log('Getting poll:', pollId); // Debug log
    console.log('Available polls:', polls); // Debug log
    
    // Handle test poll
    if (pollId === 'test') {
      return polls.test;
    }
    
    // Check local state first
    if (polls[pollId]) {
      return polls[pollId];
    }
    
    // Check Supabase database
    try {
      console.log('Querying Supabase for pollId:', pollId);
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('code', pollId)
        .single();
      
      console.log('Supabase getPoll result:', { data, error });
      
      if (error) {
        console.log('Supabase getPoll error:', error);
        return null;
      }
      
      if (data) {
        console.log('Found poll data:', data);
        // Convert Supabase format to our poll format
        const pollData = {
          id: data.code,
          title: data.title,
          creator: data.admin_name,
          dates: [], // We'll load dates separately if needed
          participants: [], // We'll load participants separately if needed
          status: 'active'
        };
        
        console.log('Converted poll data:', pollData);
        
        // Cache in local state
        setPolls(prev => ({
          ...prev,
          [pollId]: pollData
        }));
        
        return pollData;
      }
      
      return null;
    } catch (err) {
      console.error('Error getting poll:', err);
      return null;
    }
  };

  const validatePollCode = async (pollCode) => {
    console.log('Validating:', pollCode); // Debug log
    
    // Always accept test poll
    if (pollCode === 'test') {
      return true;
    }
    
    // Check if poll exists in local state
    if (polls[pollCode]) {
      return true;
    }
    
    // Check Supabase database
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('code')
        .eq('code', pollCode)
        .single();
      
      if (error) {
        console.log('Supabase validation error:', error);
        return false;
      }
      
      return !!data;
    } catch (err) {
      console.error('Error validating poll code:', err);
      return false;
    }
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
