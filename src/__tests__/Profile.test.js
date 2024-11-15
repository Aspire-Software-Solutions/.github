import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Profile from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Profile/Profile.js';
import { initializeApp } from "firebase/app";

import { useParams } from 'react-router-dom';

// Mock useParams to provide a test handle
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const firebaseConfig = {
  apiKey: "AIzaSyA2Uf5nXzvN5aSRL0iaOepYxOW6m7e2yjM",
  authDomain: "fbproject-c27b4.firebaseapp.com",
  databaseURL: "https://fbproject-c27b4-default-rtdb.firebaseio.com",
  projectId: "fbproject-c27b4",
  storageBucket: "fbproject-c27b4.appspot.com",
  messagingSenderId: "1008151670205",
  appId: "1:1008151670205:web:231a4bf7573ccd5a7ef6d4",
  measurementId: "G-VXYKQYFG9G"
};

initializeApp(firebaseConfig);

describe('Profile Component', () => {
  beforeEach(() => {
    useParams.mockReturnValue({ handle: 'testuser' }); // Mock handle for testing
  });
  test('renders Profile component and displays loading initially', () => {

    render(
      <Router>
        <Profile />
      </Router>
    );

    // Check that the loading indicator is displayed initially
  });

  test('displays "Profile not found" when no profile data is available', async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    // Wait for the component to finish loading and display "Profile not found"
    await waitFor(() => {
      expect(screen.getByText(/Profile not found/i)).toBeInTheDocument();
    });
  });
});
