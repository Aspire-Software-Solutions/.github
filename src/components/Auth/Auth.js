import React, { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPass from "./ForgotPass";

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
