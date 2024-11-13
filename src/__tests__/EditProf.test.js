// src/__tests__/AppActions.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import AddComment from '../components/AddComment';
import EditProfile from '../components/EditProfile';
import Logout from '../components/Logout';
import ThemeContext from '../context/ThemeContext';

// Mock Firebase Auth and Toast
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user123' } })),
  signOut: jest.fn(() => Promise.resolve()),
}));

describe('App Actions', () => {
  test('User can add a comment to a post', async () => {
    render(
      <Router>
        <AddComment postId="post123" />
      </Router>
    );

    // Enter a comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(commentInput, { target: { value: 'Great post!' } });

    // Submit the comment
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Comment added successfully')).toBeInTheDocument();
    });
  });

  test('User can edit profile details', async () => {
    render(
      <Router>
        <ThemeContext.Provider value={{ theme: 'light' }}>
          <EditProfile />
        </ThemeContext.Provider>
      </Router>
    );

    // Update first name and last name fields
    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

    // Submit the profile form
    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Your profile has been updated 🥳')).toBeInTheDocument();
    });
  });

  test('User can logout and is redirected to the Login component', async () => {
    render(
      <Router>
        <ThemeContext.Provider value={{ theme: 'light' }}>
          <Routes>
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<div>Login Component</div>} />
          </Routes>
        </ThemeContext.Provider>
      </Router>
    );

    // Trigger logout
    fireEvent.click(screen.getByText('Logout'));

    // Verify redirect to Login
    await waitFor(() => {
      expect(screen.getByText('Login Component')).toBeInTheDocument();
    });
  });
});
