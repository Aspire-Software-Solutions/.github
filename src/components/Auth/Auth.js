import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPass from "./ForgotPass";

/**
 * FACADE PATTERN:
 * ---------------
 * 
 * Provides a unified interface for handling various 
 * authentication actions (login, logout, signup, and multi-factor 
 * authentication). This simplifies complex authentication logic
 * by centralizing operations and enabling other components 
 * to interact through a single interface (Auth.js).
 * 
 * The Facade Pattern encapsulates the authentication 
 * logic, allowing the UI components to avoid direct interaction
 * with Firebase functions, thus enhancing modularity.
 */
const Auth = () => {
  const [authAction, setAuthAction] = useState("LOGIN");
  const [user, setUser] = useState(null);  // Hold the user info for 2FA

  const changeToLogin = () => setAuthAction("LOGIN");
  const changeToSignup = () => setAuthAction("SIGNUP");
  const changeToForgotPass = () => setAuthAction("FORGOTPASS");

  return (
    <>
      {authAction === "LOGIN" ? (
        <Login 
          changeToSignup={changeToSignup} 
          changeToForgotPass={changeToForgotPass}  // Pass it here
          setUser={setUser} 
          setAuthAction={setAuthAction} 
        />
      ) : authAction === "SIGNUP" ? (
        <Signup 
          changeToLogin={changeToLogin} 
          setUser={setUser} 
        />
      ) : authAction === "FORGOTPASS" ? (
        <ForgotPass 
          changeToLogin={changeToLogin}  // Pass it to ForgotPass for back navigation
          setUser={setUser} 
        />
      ) : null}
    </>
  );
};

export default Auth;
