import React, { useContext, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import GlobalStyle from "./styles/GlobalStyle";
import { ThemeContext } from "./context/ThemeContext";
import Router from "./AppRouter";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth
import { PresenceProvider } from "./components/Auth/Presence";
import { StatusProvider } from "./components/Auth/StatusProvider";

const App = () => {
  const { theme } = useContext(ThemeContext);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthLoaded(true);
      console.log(user ? "User is authenticated" : "No user authenticated");
    });

    return () => unsubscribe();
  }, [auth]);

  if (!isAuthLoaded) return <div>Loading...</div>;

  return (
    <PresenceProvider>
      <StatusProvider>
        <StyledThemeProvider theme={theme}>
          <GlobalStyle />
          <ToastContainer
            toastClassName="toast-style"
            autoClose={2000}
            closeButton={false}
            draggable={false}
          />
          <Router />
        </StyledThemeProvider>
      </StatusProvider>
    </PresenceProvider>
  );
};

export default App;