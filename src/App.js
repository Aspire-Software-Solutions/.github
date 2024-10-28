import React, { useContext, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import GlobalStyle from "./styles/GlobalStyle";
import { ThemeContext } from "./context/ThemeContext";
import Router from "./AppRouter"; // Always render Router
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth

const App = () => {
  const { theme } = useContext(ThemeContext);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const auth = getAuth(); // Initialize Firebase Auth

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsProfileLoaded(true); // Profile is considered loaded after checking auth
      console.log(user ? "User is authenticated" : "No user authenticated");
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  if (!isProfileLoaded) return <div>Loading...</div>; // Show loading indicator

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      <ToastContainer
        toastClassName="toast-style"
        autoClose={2000}
        closeButton={false}
        draggable={false}
      />
      <Router /> {/* Render Router unconditionally */}
    </StyledThemeProvider>
  );
};

export default App;