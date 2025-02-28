import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// Import other required dependencies

function Poll() {
  const { id } = useParams();
  const location = useLocation();
  const [username, setUsername] = useState('');
  
  useEffect(() => {
    // Try to get username from navigation state first
    if (location.state?.username) {
      setUsername(location.state.username);
    } else {
      // Fall back to localStorage if not in state (e.g., if user refreshed the page)
      const storedUsername = localStorage.getItem(`poll_${id}_username`);
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        // If no username found, redirect to join page
        window.location.href = '/';
      }
    }
  }, [id, location.state]);

  // Rest of the Poll component logic
  // Use the username variable in your existing poll logic

  return (
    <div>
      {/* Your poll UI, now using the username from state/localStorage */}
      <div>Logged in as: {username}</div>
      {/* Rest of your poll UI */}
    </div>
  );
}

export default Poll;
