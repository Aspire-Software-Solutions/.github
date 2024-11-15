import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Logout from 'C:/Users/mleil/Desktop/coding/cs4800/RIVAL/src/components/Auth/Logout.js';
import Login from '../components/Auth/Login';  // Ensure Login is correctly imported
import { getAuth, signOut } from 'firebase/auth';
import ThemeContext from '../context/ThemeContext';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}));

// Mock window.location.assign to simulate redirection
beforeAll(() => {
  delete window.location;
  window.location = { assign: jest.fn() };
});

describe('Logout Component', () => {
  test('logs out the user and redirects to Login component', async () => {
    render(
      <ThemeContext.Provider value={{ theme: 'light' }}>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </Router>
      </ThemeContext.Provider>
    );

    // Simulate clicking the logout button
    fireEvent.click(screen.getByText(/Logout/i));

    // Ensure signOut was called
    await waitFor(() => expect(signOut).toHaveBeenCalled());

    // Check that window.location.assign was called with "/"
    await waitFor(() => expect(window.location.assign).toHaveBeenCalledWith("/"));

    // Check that the Login component's unique identifier is in the DOM
    await waitFor(() => {
      expect(screen.getByText(/Log In/i)).toBeInTheDocument();  // Adjust to an element unique to the Login component
    });
  });
});
