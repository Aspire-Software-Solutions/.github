import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUp from '../../components/Auth/Signup'; // Adjust path as needed
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { PhoneAuthProvider, signInWithPhoneNumber } from 'firebase/auth';
import { toast } from 'react-toastify';

// Mock Firebase Auth, Firestore, and Toast
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  PhoneAuthProvider: { credential: jest.fn() },
  signInWithPhoneNumber: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Signup Component', () => {
  test('creates a new user, sends verification text, and signs up', async () => {
    // Mock Firebase functions
    const mockAuth = {};
    getAuth.mockReturnValue(mockAuth);
    createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'test-uid', getIdToken: jest.fn().mockResolvedValue('test-token') },
    });
    updateProfile.mockResolvedValue();
    getFirestore.mockReturnValue({});
    setDoc.mockResolvedValue();
    signInWithPhoneNumber.mockResolvedValue({
      confirmationResult: { confirm: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }) },
    });

    render(<SignUp changeToLogin={() => {}} />);

    // Fill in form inputs
    fireEvent.change(screen.getByPlaceholderText(/Enter first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Choose handle/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirm password/i), { target: { value: 'Password123!' } });

    // Navigate through signup steps
    fireEvent.click(screen.getByText(/Next/i)); // Step 1 to Step 2
    fireEvent.change(screen.getByPlaceholderText(/Enter phone number/i), { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByText(/Send Verification Code/i));

    // Check if phone verification is sent
    await waitFor(() => {
      expect(signInWithPhoneNumber).toHaveBeenCalledWith(mockAuth, '+1234567890', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Verification code sent');
    });

    // Simulate code entry and verification
    fireEvent.change(screen.getByPlaceholderText(/Enter the code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByText(/Verify Code/i));

    // Click Sign Up after verifying phone number
    fireEvent.click(screen.getByText(/Sign Up/i));

    // Wait for Firebase signup calls and check success toast
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'Password123!');
      expect(updateProfile).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('You are signed up and logged in');
    });
  });
});
