import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function PollJoin() {
  const navigate = useNavigate();
  const { id: pollId } = useParams();
  const [selectedOption, setSelectedOption] = useState('new');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [existingNames] = useState(['John', 'Alice', 'Bob']); // Demo data, replace with actual names

  const MAX_NAME_LENGTH = 20;

  // Normalize text input (trim whitespace, normalize case)
  const normalizeText = (text) => {
    return text.trim().replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9\s()]/g, '');
  };

  // Check for name duplicates and suggest alternative
  const checkNameAvailability = (name) => {
    const normalizedName = normalizeText(name);
    if (!existingNames.includes(normalizedName)) return normalizedName;

    let counter = 2;
    while (existingNames.includes(`${normalizedName} (${counter})`)) {
      counter++;
    }
    return `${normalizedName} (${counter})`;
  };

  // Handle name input change
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_NAME_LENGTH) {
      setCustomName(value);
      setError('');
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const finalName = normalizeText(customName);

    if (!finalName) {
      setError('Please enter a valid name');
      return;
    }

    if (existingNames.includes(finalName)) {
      setError(`There's already a "${finalName}" in this poll. Is this you or would you like to be "${checkNameAvailability(finalName)}"?`);
      return;
    }

    // Changed route from /blank to /view to use SamplePoll
    navigate(`/poll/${pollId}/view`, { 
      state: { username: finalName } 
    });
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Join Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block font-medium mb-2">Select or enter your name:</label>
          
          {/* Recent names */}
          {existingNames.map((name) => (
            <div key={name} className="flex items-center space-x-2">
              <input
                type="radio"
                id={name}
                name="nameChoice"
                value={name}
                checked={selectedOption === name}
                onChange={(e) => {
                  setSelectedOption(e.target.value);
                  setCustomName(e.target.value);
                }}
                className="form-radio"
              />
              <label htmlFor={name}>{name}</label>
            </div>
          ))}

          {/* Other option with inline text field */}
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="new"
              name="nameChoice"
              value="new"
              checked={selectedOption === 'new'}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="form-radio"
            />
            <input
              type="text"
              value={customName}
              onChange={handleNameChange}
              onFocus={() => setSelectedOption('new')}
              placeholder="Enter your name"
              className="flex-1 border rounded p-2"
              maxLength={MAX_NAME_LENGTH}
            />
          </div>

          {/* Character counter */}
          <div className="text-sm text-gray-500 text-right">
            {customName.length}/{MAX_NAME_LENGTH}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={!customName.trim()}
        >
          Join Poll
        </button>
      </form>
    </div>
  );
}

export default PollJoin;
