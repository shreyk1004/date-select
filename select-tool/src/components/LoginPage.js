import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    if (username) {
      onLogin(username);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-8">
          <h1 className="text-3xl font-bold">Kalindar</h1>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-6">
            <input
              type="text"
              name="username"
              placeholder="Enter your name"
              className="w-3/4 border rounded-lg p-3 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-3/4 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-red-400 transition-colors duration-200"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
