// AddComment.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import AddComment from '../../components/Auth/AddComment';
import { toast } from 'react-toastify';

// Mock Firebase functions and Toast
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: 'user123', displayName: 'Test User' } })),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({ handle: 'testuser' }) })),
  updateDoc: jest.fn(),
  arrayUnion: jest.fn(),
  increment: jest.fn(),
}));
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('AddComment Component', () => {
  test('adds a comment to a post', async () => {
    render(<AddComment id="post123" />);

    // Simulate user typing a comment
    const commentInput = screen.getByPlaceholderText(/Reply with an attack!/i);
    fireEvent.change(commentInput, { target: { value: 'This is a test comment' } });

    // Simulate form submission
    const submitButton = screen.getByText(/Reply/i);
    fireEvent.click(submitButton);

    // Check if Firebase updateDoc was called with expected data
    await waitFor(() =>
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        comments: arrayUnion({
          text: 'This is a test comment',
          userId: 'user123',
          userName: 'Test User',
          userAvatar: '/default-avatar.png', // Assuming default as mock setup
          handle: 'testuser',
          createdAt: expect.any(Date),
        }),
        commentsCount: increment(1),
      })
    );

    // Check if success toast was shown
    expect(toast.success).toHaveBeenCalledWith('Your reply has been added');
  });

  test('adds a reply to an existing comment', async () => {
    render(<AddComment id="post123" parentCommentId="comment456" />); // Assuming `parentCommentId` is the prop used for replies

    // Simulate user typing a reply
    const replyInput = screen.getByPlaceholderText(/Reply to this comment/i);
    fireEvent.change(replyInput, { target: { value: 'This is a test reply' } });

    // Simulate form submission
    const replyButton = screen.getByText(/Reply/i);
    fireEvent.click(replyButton);

    // Check if Firebase updateDoc was called with expected nested data
    await waitFor(() =>
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        [`replies.${'comment456'}`]: arrayUnion({
          text: 'This is a test reply',
          userId: 'user123',
          userName: 'Test User',
          userAvatar: '/default-avatar.png', // Assuming a default mock setup
          handle: 'testuser',
          createdAt: expect.any(Date),
        }),
      })
    );

  test('shows error if comment is empty', async () => {
    render(<AddComment id="post123" />);

    // Click on submit without typing a comment
    const submitButton = screen.getByText(/Reply/i);
    fireEvent.click(submitButton);

    // Expect an error toast notification
    expect(toast.error).toHaveBeenCalledWith('Reply something');
  });

  test('deletes a comment successfully', async () => {
    const commentData = {
      id: 'comment123',
      text: 'This is a comment to delete',
      userId: 'user123',
      userName: 'Test User',
    };

    render(<AddComment id="post123" comment={commentData} />);

    // Find and click the delete button
    const deleteButton = screen.getByText(/Delete/i); // Adjust the selector based on your delete button text/icon
    fireEvent.click(deleteButton);

    // Check if Firebase updateDoc was called with arrayRemove to delete the comment
    await waitFor(() =>
      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        comments: arrayRemove({
          id: 'comment123',
          text: 'This is a comment to delete',
          userId: 'user123',
          userName: 'Test User',
        }),
      })
    );

    // Check if success toast was shown
    expect(toast.success).toHaveBeenCalledWith('Comment has been deleted');
  });

  test('shows error if deletion fails', async () => {
    const commentData = {
      id: 'comment123',
      text: 'This is a comment to delete',
      userId: 'user123',
      userName: 'Test User',
    };

    // Mock updateDoc to throw an error
    updateDoc.mockRejectedValueOnce(new Error('Failed to delete comment'));

    render(<AddComment id="post123" comment={commentData} />);

    // Click on delete button
    const deleteButton = screen.getByText(/Delete/i);
    fireEvent.click(deleteButton);

    // Wait for the error toast to show
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to delete comment')
    );
  });
})});
