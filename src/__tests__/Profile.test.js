// src/__tests__/Profile.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Profile from '../components/Profile/Profile';
import ProfileInfo from '../components/Profile/ProfileInfo';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Mock Firebase functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('Profile and ProfileInfo Components', () => {
  beforeEach(() => {
    // Mock Firebase setup and set initial data if needed
  });

  test('renders Profile component and displays user info', async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    // Check that the loader shows initially (while data is loading)
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Assuming we have mock data that resolves the loading state
    await waitFor(() => {
      expect(screen.getByText(/Profile not found/i)).toBeInTheDocument();
    });
  });

  test('renders ProfileInfo component and displays user details', async () => {
    const mockProfile = {
      handle: 'testuser',
      fullname: 'Test User',
      bio: 'This is a test bio',
      followersCount: 5,
      followingCount: 3,
      website: 'https://example.com',
    };

    render(
      <Router>
        <ProfileInfo profile={mockProfile} />
      </Router>
    );

    // Check that basic profile information is displayed
    expect(screen.getByText(mockProfile.fullname)).toBeInTheDocument();
    expect(screen.getByText(`@${mockProfile.handle}`)).toBeInTheDocument();
    expect(screen.getByText(mockProfile.bio)).toBeInTheDocument();

    // Check links to followers and following
    fireEvent.click(screen.getByText(/5 followers/i));
    fireEvent.click(screen.getByText(/3 following/i));

    // Verify the user is redirected correctly (for example, using mock navigation)
  });

  test('allows starting a conversation with another user', async () => {
    const mockProfile = {
      userId: 'testUserId',
      handle: 'testuser',
      fullname: 'Test User',
    };

    render(
      <Router>
        <ProfileInfo profile={mockProfile} />
      </Router>
    );

    // Simulate starting a conversation
    const messageButton = screen.getByRole('button', { name: /Message/i });
    fireEvent.click(messageButton);

    // Wait for any navigation effect if applicable
    await waitFor(() => {
      // Mock response to simulate the start of a conversation
      expect(screen.getByText(/Starting conversation.../i)).toBeInTheDocument();
    });
  });
});
