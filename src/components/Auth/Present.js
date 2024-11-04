import React, { createContext, useContext, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";

// Create context
export const PresenceContext = createContext();

// Custom hook for easier usage
export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }) => {
  const auth = getAuth();
  const rtdb = getDatabase();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userStatusRef = ref(rtdb, `/status/${user.uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    // Set up presence handling
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        return;
      }

      // If we're connected, set up our presence system
      onDisconnect(userStatusRef)
        .set(isOfflineForDatabase)
        .then(() => {
          set(userStatusRef, isOnlineForDatabase);
        });
    });

    // Set up a heartbeat to keep the presence state fresh
    const heartbeatInterval = setInterval(() => {
      if (auth.currentUser) {
        set(userStatusRef, {
          ...isOnlineForDatabase,
          last_changed: serverTimestamp()
        });
      }
    }, 30000);

    // Only clean up on app unmount, not on page navigation
    return () => {
      unsubscribe();
      clearInterval(heartbeatInterval);
      // We don't set offline status here anymore
    };
  }, [auth.currentUser, rtdb]);

  // We can provide additional presence-related values here if needed
  const value = {};

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};