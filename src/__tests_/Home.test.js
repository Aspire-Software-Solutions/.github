import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Home from '../pages/Home';

// Mock Firebase services
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({ name: 'Test User', email: 'testuser@example.com' })
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'testUserId', displayName: 'Test User' },
    onAuthStateChanged: jest.fn((callback) => {
      // Immediately invoke the callback with a mock user
      callback({ uid: 'testUserId', displayName: 'Test User' });
      return jest.fn(); // Mock unsubscribe function
    }),
  })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  onValue: jest.fn((ref, callback) => jest.fn()), // Mock an unsubscribe function
}));

test('renders Home component without error', () => {
  render(
    <Router>
      <Home />
    </Router>
  );

  // Check for some content in Home component to ensure it renders
  expect(screen.getByText(/Home/i)).toBeInTheDocument();
});
