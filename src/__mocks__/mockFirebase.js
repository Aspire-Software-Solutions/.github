jest.mock('firebase/auth', () => {
    return {
      getAuth: jest.fn(() => ({
        currentUser: {
          uid: "mockUserId",
          email: "testuser@example.com",
        },
      })),
      signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
        user: {
          uid: "mockUserId",
          email: "testuser@example.com",
        },
      })),
      signOut: jest.fn(() => Promise.resolve()),
      onAuthStateChanged: jest.fn((auth, callback) => {
        callback({
          uid: "mockUserId",
          email: "testuser@example.com",
        });
      }),
    };
  });
  
  jest.mock('firebase/firestore', () => {
    return {
      getFirestore: jest.fn(),
      doc: jest.fn(),
      updateDoc: jest.fn(),
      getDoc: jest.fn(() => Promise.resolve({
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          uid: "mockUserId",
          displayName: "Test User",
          email: "testuser@example.com",
        })),
      })),
    };
  });
  