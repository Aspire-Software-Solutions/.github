// Import necessary libraries
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import MasterQuickie from '../src/components/Quickie/MasterQuickie';
import NewQuickie from '../src/components/Quickie/NewQuickie';
import { BrowserRouter } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

// Mock Firebase Firestore and Auth
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ isAdmin: false }) }),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => callback({ uid: 'testUserId' })),
}));

describe('MasterQuickie Component', () => {
  // Test case: View Post Details
  test('User clicks on a post to view details', () => {
    render(
      <BrowserRouter>
        <MasterQuickie />
      </BrowserRouter>
    );

    // Simulate user clicking on a post
    const postElement = screen.getByText(/Post Title/i); // Assuming 'Post Title' is the title of the post
    fireEvent.click(postElement);

    // Verify that post details are displayed
    expect(screen.getByText(/Post Details/i)).toBeInTheDocument();
  });

  // Test case: Report Comment as Inappropriate
  test('User clicks Report on a specific comment', () => {
    render(
      <BrowserRouter>
        <MasterQuickie />
      </BrowserRouter>
    );

    // Simulate user clicking 'Report' on a comment
    const reportButton = screen.getByText(/Report/i); // Assuming 'Report' button is present
    fireEvent.click(reportButton);

    // Verify that comment is reported to moderators
    expect(screen.getByText(/Comment reported/i)).toBeInTheDocument();
  });

  // Test case: Post Preview for Multimedia Upload
  test('User uploads multimedia during post creation', () => {
    render(
      <BrowserRouter>
        <MasterQuickie />
      </BrowserRouter>
    );

    // Simulate user uploading a file
    const fileInput = screen.getByLabelText(/Upload Multimedia/i);
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verify that multimedia preview appears
    expect(screen.getByAltText(/Multimedia Preview/i)).toBeInTheDocument();
  });

  // Test case: Share Post to External Platform
  test('User clicks Share and selects Copy Link', () => {
    render(
      <BrowserRouter>
        <MasterQuickie />
      </BrowserRouter>
    );

    // Simulate user clicking 'Share' and selecting 'Copy Link'
    const shareButton = screen.getByText(/Share/i);
    fireEvent.click(shareButton);
    const copyLinkOption = screen.getByText(/Copy Link/i);
    fireEvent.click(copyLinkOption);

    // Verify that shareable link is generated
    expect(screen.getByText(/Link copied to clipboard/i)).toBeInTheDocument();
  });

  // Test case: Restrict Post Access Based on Profile Privacy
  test('Non-follower tries to view a post from a private profile', () => {
    render(
      <BrowserRouter>
        <MasterQuickie profilePrivacy="private" />
      </BrowserRouter>
    );

    // Simulate non-follower trying to access a post
    const postElement = screen.queryByText(/Post Title/i);

    // Verify that access is denied
    expect(screen.getByText(/Profile is private/i)).toBeInTheDocument();
  });

  // Test case: Downvote a Post
  test('User clicks Downvote button on a post', () => {
    render(
      <BrowserRouter>
        <MasterQuickie isAuthenticated={true} />
      </BrowserRouter>
    );

    // Simulate user clicking 'Downvote'
    const downvoteButton = screen.getByText(/Downvote/i);
    fireEvent.click(downvoteButton);

    // Verify that downvote is registered
    expect(screen.getByText(/Downvotes: 1/i)).toBeInTheDocument();
  });

  // Test case: Share a Post on User Profile
  test('User clicks Share button on a post', () => {
    render(
      <BrowserRouter>
        <MasterQuickie isAuthenticated={true} />
      </BrowserRouter>
    );

    // Simulate user clicking 'Share'
    const shareButton = screen.getByText(/Share/i);
    fireEvent.click(shareButton);

    // Verify that post is shared on user profile with 'Shared' tag
    expect(screen.getByText(/Shared/i)).toBeInTheDocument();
  });
});

describe('NewQuickie Component', () => {
  // Test case: Create a new post
  test('User creates a new post using NewQuickie component', () => {
    render(
      <BrowserRouter>
        <NewQuickie />
      </BrowserRouter>
    );

    // Simulate user typing in post input
    const postInput = screen.getByPlaceholderText(/What's on your mind?/i);
    fireEvent.change(postInput, { target: { value: 'This is a new quickie post!' } });

    // Simulate user clicking the post button
    const postButton = screen.getByText(/Post/i);
    fireEvent.click(postButton);

    // Verify that the new post is created (assuming it appears in the feed)
    expect(screen.getByText(/This is a new quickie post!/i)).toBeInTheDocument();
  });
});