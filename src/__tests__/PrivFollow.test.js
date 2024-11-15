import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Profile from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Profile/Profile.js';
import ProfileInfo from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Profile/ProfileInfo.js';
import Follow from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Profile/Follow.js';
import FollowersFollowing from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Profile/FollowersFollowing.js';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Mock Firebase services and Toast notifications
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn().mockReturnValue({
        currentUser: { uid: '123', displayName: 'Test User' }
    }),
    signOut: jest.fn()
}));
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn().mockReturnValue({}),
    collection: jest.fn(),
    doc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn()
}));

describe('Profile Page Tests', () => {
    test('Displays profile and user information correctly', async () => {
        render(
            <Router>
                <Routes>
                    <Route path="/:handle" element={<Profile />} />
                </Routes>
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText(/Profile not found/i)).toBeInTheDocument();
        });
    });

    test('Allows a user to follow another user', async () => {
        render(
            <Router>
                <Follow isFollowing={false} />
            </Router>
        );

        const followButton = screen.getByRole('button', { name: /Follow/i });
        fireEvent.click(followButton);

        await waitFor(() => {
            expect(screen.getByText(/Requested/i)).toBeInTheDocument();
        });
    });

    test('Allows a user to unfollow an existing followed user', async () => {
        render(
            <Router>
                <Follow isFollowing={true} />
            </Router>
        );

        const unfollowButton = screen.getByRole('button', { name: /Unfollow/i });
        fireEvent.click(unfollowButton);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Follow/i })).toBeInTheDocument();
        });
    });

    test('Requests to follow a private user', async () => {
        render(
            <Router>
                <Follow isFollowing={false} isPrivate />
            </Router>
        );

        const requestButton = screen.getByRole('button', { name: /Request Follow/i });
        fireEvent.click(requestButton);

        await waitFor(() => {
            expect(screen.getByText(/Requested/i)).toBeInTheDocument();
        });
    });

    test('Displays followers and following list', async () => {
        render(
            <Router>
                <Routes>
                    <Route path="/:handle/followers" element={<FollowersFollowing />} />
                    <Route path="/:handle/following" element={<FollowersFollowing />} />
                </Routes>
            </Router>
        );

        await waitFor(() => {
            expect(screen.getByText(/No users found/i)).toBeInTheDocument();
        });
    });
});
