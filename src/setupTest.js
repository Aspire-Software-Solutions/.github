// src/setupTests.js
const { TextEncoder, TextDecoder } = require('util');
import '@testing-library/jest-dom';


global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof global.ReadableStream === 'undefined') {
    global.ReadableStream = class {
      constructor() {
        throw new Error('ReadableStream is not implemented');
      }
    };
  }

jest.mock("firebase/auth", () => ({
    getAuth: jest.fn(() => ({
      currentUser: null, // Mock the `currentUser` as null for unauthenticated state
    })),
    signInWithEmailAndPassword: jest.fn(), // Mock other functions as needed
    sendPasswordResetEmail: jest.fn(),
}));
  
