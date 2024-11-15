import React from 'react';
import { render, screen } from '@testing-library/react';
import ConversationsList from '/Users/miafelipe/Desktop/coding/RIVAL/src/components/Conversations/ConversationsList.js';
import { useAuth, getAuth } from 'firebase/auth';
import ModerationDashboard from '/Users/miafelipe/Desktop/coding/RIVAL/src/pages/ContentModeration.js'
import { BrowserRouter as Router } from 'react-router-dom';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import AppRouter from '/Users/miafelipe/Desktop/coding/RIVAL/src/AppRouter.js';

// Mock useAuth from Firebase to simulate an authenticated user
jest.mock('firebase/auth', () => ({
  useAuth: jest.fn(),
}));

describe('ConversationsList Component', () => {
  beforeEach(() => {
    // Mock user authentication
    useAuth.mockReturnValue({
      currentUser: { uid: 'testUserId', displayName: 'Test User' },
    });
  });

  test('renders list of conversations', () => {
    const mockConversations = [
      { id: '1', name: 'Conversation 1' },
      { id: '2', name: 'Conversation 2' },
      { id: '3', name: 'Conversation 3' },
    ];

    // Render the ConversationsList component
    render(
      <Router>
        <ConversationsList conversations={mockConversations} />
      </Router>
    );

    // Check if each conversation is rendered
    mockConversations.forEach((conv) => {
      expect(screen.getByText(conv.name)).toBeInTheDocument();
    });
  });
});
