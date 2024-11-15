import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router} from 'react-router-dom';
import Nav from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/layout/Nav.js';
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useParams } from 'react-router-dom';

// Firebase configuration for testing
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

// Initialize Firebase app for testing
initializeApp(firebaseConfig);

// Mock Firebase authentication
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: '123', email: 'test@example.com' },
  })),
}));

// Mock useParams to simulate URL parameters
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useHistory: () => ({
      push: jest.fn(),
    }),
    useLocation: () => ({
      pathname: '/home',
    }),
    useParams: () => ({ auth: true }),
  }));

describe('Nav Component', () => {
  beforeEach(() => {
    render(
      <Router>
        <Nav />
      </Router>
    );
  });

   test('renders Home icon', () => {
     expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
   });

//   test('renders Explore icon', () => {
//     expect(screen.getByRole('link', { name: /explore/i })).toBeInTheDocument();
//   });

//   test('displays profile avatar and dropdown options', () => {
//     const profileAvatar = screen.getByAltText(/profile/i);
//     expect(profileAvatar).toBeInTheDocument();

//     fireEvent.click(profileAvatar);
//     expect(screen.getByText(/profile/i)).toBeInTheDocument();
//     expect(screen.getByText(/bookmarks/i)).toBeInTheDocument();
//   });

//   test('renders notification and chat icons with badge if counts are provided', () => {
//     expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
//     expect(screen.getByRole('link', { name: /conversations/i })).toBeInTheDocument();
//   });

//   test('toggles sidebar on hamburger icon click', () => {
//     const hamburgerIcon = screen.getByRole('button', { name: /hamburger/i });
//     expect(hamburgerIcon).toBeInTheDocument();

//     fireEvent.click(hamburgerIcon);
//     expect(screen.getByText(/home/i)).toBeInTheDocument(); // Should now display sidebar
  });
// });
