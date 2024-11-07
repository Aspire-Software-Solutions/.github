import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";

export const PresenceContext = createContext();

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }) => {
  const auth = getAuth();
  const rtdb = getDatabase();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        initializePresence(user.uid);
      } else {
        setIsInitialized(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  const initializePresence = (userId) => {
    const userStatusRef = ref(rtdb, `/status/${userId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    // Set initial offline status
    set(userStatusRef, isOfflineForDatabase);

    // Monitor connection state
    const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        setIsInitialized(false);
        return;
      }

      // When we connect, set up our presence system
      onDisconnect(userStatusRef)
        .set(isOfflineForDatabase)
        .then(() => {
          set(userStatusRef, isOnlineForDatabase);
          setIsInitialized(true);
        });
    });

    // Set up a heartbeat
    const heartbeatInterval = setInterval(() => {
      if (auth.currentUser) {
        set(userStatusRef, {
          ...isOnlineForDatabase,
          last_changed: serverTimestamp()
        });
      }
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribeConnected();
      clearInterval(heartbeatInterval);
      // Set offline status when cleaning up
      if (auth.currentUser) {
        set(userStatusRef, isOfflineForDatabase);
      }
    };
  };

  const value = {
    isInitialized,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};