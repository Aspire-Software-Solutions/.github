// src/__tests__/Follow.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Follow from '../components/Profile/Follow';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Mock Firebase functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn((val) => val),
  arrayRemove: jest.fn((val) => val),
  increment: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'currentUserId' },
  })),
}));

describe('Follow Component', () => {
  const mockUserId = 'mockUserId';

  test('renders Follow button and allows user to follow another user', async () => {
    render(<Follow isFollowing={false} userId={mockUserId} />);

    const followButton = screen.getByRole('button', { name: /follow/i });
    expect(followButton).toBeInTheDocument();

    fireEvent.click(followButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        followers: expect.any(Function),
        followersCount: expect.any(Function),
      });
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        following: expect.any(Function),
        followingCount: expect.any(Function),
      });
      expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
    });
  });

  test('renders Unfollow button and allows user to unfollow another user', async () => {
    render(<Follow isFollowing={true} userId={mockUserId} />);

    const unfollowButton = screen.getByRole('button', { name: /unfollow/i });
    expect(unfollowButton).toBeInTheDocument();

    fireEvent.click(unfollowButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        followers: expect.any(Function),
        followersCount: expect.any(Function),
      });
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        following: expect.any(Function),
        followingCount: expect.any(Function),
      });
      expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
    });
  });
});
