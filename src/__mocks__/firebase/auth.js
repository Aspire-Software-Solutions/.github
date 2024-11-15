// __mocks__/firebase/auth.js

// Mock for `getAuth` function
export const getAuth = jest.fn(() => ({
  currentUser: { 
    uid: 'mockUserId',
    email: 'mockuser@example.com',
  },
}));

// Mock for `signInWithEmailAndPassword` function
export const signInWithEmailAndPassword = jest.fn((auth, email, password) => {
  if (email === 'test@example.com' && password === 'password') {
    return Promise.resolve({
      user: {
        uid: 'mockUserId',
        email: 'test@example.com',
      },
    });
  } else {
    return Promise.reject(new Error('Invalid credentials'));
  }
});

// Mock for `signOut` function
export const signOut = jest.fn(() => Promise.resolve());

// Mock for `onAuthStateChanged` function
export const onAuthStateChanged = jest.fn((auth, callback) => {
  callback(getAuth().currentUser);
});
