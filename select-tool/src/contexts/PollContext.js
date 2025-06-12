import React, { createContext, useContext, useState } from 'react';
import * as pollService from '../services/pollService';

const PollContext = createContext(null);

export function PollProvider({ children }) {
  const [pollCache, setPollCache] = useState({});
  const [userSessions, setUserSessions] = useState(() => {
    const saved = localStorage.getItem('pollUserSessions');
    return saved ? JSON.parse(saved) : {};
  });

  // Save user session for a poll
  const setPollSession = (pollId, username) => {
    setUserSessions(prev => {
      const updated = { ...prev, [pollId]: username };
      localStorage.setItem('pollUserSessions', JSON.stringify(updated));
      return updated;
    });
  };

  // Get saved user session for a poll
  const getPollSession = (pollId) => {
    return userSessions[pollId];
  };

  // Clear user session for a poll
  const clearPollSession = (pollId) => {
    setUserSessions(prev => {
      const updated = { ...prev };
      delete updated[pollId];
      localStorage.setItem('pollUserSessions', JSON.stringify(updated));
      return updated;
    });
  };

  // Validate if a poll code exists
  const validatePollCode = async (pollCode) => {
    try {
      return await pollService.validatePollCode(pollCode);
    } catch (error) {
      return false;
    }
  };

  // Get complete poll data
  const getPoll = async (pollCode) => {
    try {
      // Return test poll data for 'test' code
      if (pollCode === 'test') {
        return pollService.getTestPollData();
      }

      // Check cache first
      if (pollCache[pollCode]) {
        return pollCache[pollCode];
      }

      // Fetch from database
      const pollData = await pollService.getCompletePollData(pollCode);
      
      // Cache the result
      setPollCache(prev => ({
        ...prev,
        [pollCode]: pollData
      }));

      return pollData;
    } catch (error) {
      console.error('Error getting poll:', error);
      return null;
    }
  };

  // Refresh poll data from database
  const refreshPoll = async (pollCode) => {
    try {
      if (pollCode === 'test') {
        return pollService.getTestPollData();
      }

      const pollData = await pollService.getCompletePollData(pollCode);
      
      // Update cache
      setPollCache(prev => ({
        ...prev,
        [pollCode]: pollData
      }));

      return pollData;
    } catch (error) {
      console.error('Error refreshing poll:', error);
      return null;
    }
  };

  // Get poll participants/users
  const getPollUsers = async (pollCode) => {
    try {
      return await pollService.getPollUsers(pollCode);
    } catch (error) {
      console.error('Error getting poll users:', error);
      return [];
    }
  };

  // Add user to poll
  const addUserToPoll = async (pollCode, username) => {
    try {
      const result = await pollService.addUserToPoll(pollCode, username);
      
      // Invalidate cache to force refresh
      setPollCache(prev => {
        const updated = { ...prev };
        delete updated[pollCode];
        return updated;
      });
      
      return result;
    } catch (error) {
      console.error('Error adding user to poll:', error);
      throw error;
    }
  };

  // Add date to poll
  const addDateToPoll = async (pollCode, date, username) => {
    try {
      const result = await pollService.addDateToPoll(pollCode, date, username);
      
      // Invalidate cache
      setPollCache(prev => {
        const updated = { ...prev };
        delete updated[pollCode];
        return updated;
      });
      
      return result;
    } catch (error) {
      console.error('Error adding date to poll:', error);
      throw error;
    }
  };

  // Remove date from poll
  const removeDateFromPoll = async (pollCode, date) => {
    try {
      const result = await pollService.removeDateFromPoll(pollCode, date);
      
      // Invalidate cache
      setPollCache(prev => {
        const updated = { ...prev };
        delete updated[pollCode];
        return updated;
      });
      
      return result;
    } catch (error) {
      console.error('Error removing date from poll:', error);
      throw error;
    }
  };

  // Set user availability for a date
  const setUserAvailability = async (pollCode, date, username, available) => {
    try {
      const result = await pollService.setUserAvailability(pollCode, date, username, available);
      
      // Invalidate cache
      setPollCache(prev => {
        const updated = { ...prev };
        delete updated[pollCode];
        return updated;
      });
      
      return result;
    } catch (error) {
      console.error('Error setting user availability:', error);
      throw error;
    }
  };

  // Add comment to date
  const addCommentToDate = async (pollCode, date, username, comment) => {
    try {
      const result = await pollService.addCommentToDate(pollCode, date, username, comment);
      
      // Invalidate cache
      setPollCache(prev => {
        const updated = { ...prev };
        delete updated[pollCode];
        return updated;
      });
      
      return result;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Verify admin access
  const verifyAdminAccess = async (pollCode, adminToken) => {
    try {
      return await pollService.verifyAdminAccess(pollCode, adminToken);
    } catch (error) {
      console.error('Error verifying admin access:', error);
      return false;
    }
  };

  // Get admin info for a poll
  const getPollAdminInfo = async (pollCode, adminToken) => {
    try {
      return await pollService.getPollAdminInfo(pollCode, adminToken);
    } catch (error) {
      console.error('Error getting poll admin info:', error);
      throw error;
    }
  };

  // For backward compatibility - these maintain local state for UI components
  const [localPolls, setLocalPolls] = useState({ test: pollService.getTestPollData() });

  const setPoll = (pollId, updatedPoll) => {
    setLocalPolls(prev => ({
      ...prev,
      [pollId]: updatedPoll
    }));
  };

  const getLocalPoll = (pollId) => {
    return localPolls[pollId];
  };

  // Check admin token (for local access)
  const checkAdminToken = (pollId, token) => {
    if (pollId === 'test') return true;
    
    const storedToken = localStorage.getItem(`poll_${pollId}_admin_token`);
    return storedToken === token;
  };

  return (
    <PollContext.Provider value={{
      // Core poll operations
      validatePollCode,
      getPoll,
      refreshPoll,
      getPollUsers,
      addUserToPoll,
      addDateToPoll,
      removeDateFromPoll,
      setUserAvailability,
      addCommentToDate,
      
      // User session management
      setPollSession,
      getPollSession,
      clearPollSession,
      
      // Admin operations
      verifyAdminAccess,
      getPollAdminInfo,
      checkAdminToken,
      
      // Local state (for backward compatibility)
      setPoll,
      getLocalPoll,
      polls: localPolls,
      setPolls: setLocalPolls
    }}>
      {children}
    </PollContext.Provider>
  );
}

export const usePoll = () => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};
