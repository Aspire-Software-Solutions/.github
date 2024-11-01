import React, { useState, useEffect, useRef } from "react"; // Import React
import { 
  getAuth, 
  getMultiFactorResolver, 
  PhoneAuthProvider, 
  RecaptchaVerifier, 
  signInWithEmailAndPassword,
  PhoneMultiFactorGenerator 
} from "firebase/auth"; // Import authentication suite of products
import { toast } from "react-toastify"; // App notifications
import { Form, Button, Container, Row, Col } from "react-bootstrap"; // Bootstrap 5 UI Framework
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap 5 CSS
import { displayError } from "../../utils"; // Errors (that will be displayed as a notification)
import useInput from "../../hooks/useInput"; // User input
import '../../styles/Login.css' // Specific Styles for Login.CSS
import HexagonBox from "../ui/HexagonBox";

// Adjust the path if necessary
const companyLogo = "/companyLogo.png";

/**
 * TEMPLATE METHOD PATTERN:
 * ------------------------
 * 
 * Defines a common structure for authentication forms,
 * where shared steps (input collection, form validation) 
 * are handled similarly, but unique steps (like additional 
 * fields in signup or password strength check) are implemented 
 * specifically for each component.
 * 
 * This approach ensures a consistent authentication flow while
 * allowing flexibility for distinct actions in login and signup.
 */
const SignIn = ({ changeToSignup, changeToForgotPass }) => {
  const email = useInput("");
  const password = useInput("");
  const auth = getAuth();
  
  const [code, setCode] = useState(""); 
  const [verificationId, setVerificationId] = useState(null); 
  const [resolver, setResolver] = useState(null); 
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const [isTwoFactorRequired, setIsTwoFactorRequired] = useState(false);

  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // State for disabling the button
  const [countdown, setCountdown] = useState(10); // Countdown timer state

  const codeInputRef = useRef(null); // Reference for the verification code input field

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (isTwoFactorRequired && resolver) {
      sendVerificationCode(); // Automatically trigger the 2FA code when 2FA is required
      codeInputRef.current?.focus(); // Automatically focus the code input field
    }
  }, [isTwoFactorRequired, resolver]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.value || !password.value) {
      return toast.error("Please fill in all fields.");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
      const { user } = userCredential;
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("You are logged in.");
    } catch (error) {
      if (error.code === "auth/multi-factor-auth-required") {
        const resolver = getMultiFactorResolver(auth, error);
        setResolver(resolver);
        setIsTwoFactorRequired(true);
        toast.info("2FA required. Sending verification code.");
      } else {
        return displayError(error);
      }
    }
  };

  const sendVerificationCode = async () => {
    if (!resolver) {
      toast.error("Multi-factor resolver is missing.");
      return;
    }
  
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container", 
        {
          size: "invisible",
          callback: (response) => {
            console.log("reCAPTCHA solved.");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired.");
          },
        }
      );
    }
    
    try {
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[selectedIndex],
        session: resolver.session,
      };
  
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);
      setVerificationId(verificationId);
      toast.success("Verification code sent to your phone.");

      // Start countdown and disable button
      setIsButtonDisabled(true);
      setCountdown(10);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdownInterval);
            setIsButtonDisabled(false);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      codeInputRef.current?.focus(); // Focus the code input field after sending the code
    } catch (error) {
      toast.error("Failed to send verification code. Please try again.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    }
  };

  const verifyCode = async () => {
    if (!verificationId || !resolver) {
      toast.error("Verification ID or resolver missing.");
      return;
    }

    try {
      const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, code);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

      const { user } = userCredential;
      localStorage.setItem("token", await user.getIdToken());
      localStorage.setItem("user", JSON.stringify(user));
      toast.success("Successfully logged in with 2FA!");
    } catch (error) {
      toast.error("Invalid verification code. Please try again.");
    }
  };

  const handleForgotPassword = () => {
    toast.info("Redirecting to password reset page...");
    changeToForgotPass();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isTwoFactorRequired) {
        verifyCode(); // Trigger the Verify button action for 2FA
      } else {
        handleLogin(e); // Trigger the Sign In button action
      }
    }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" id="overallContainer">
      <Row className="d-flex align-items-center justify-content-center">
        <Col xs={12} md={6} className="d-none d-sm-block d-flex justify-content-center align-items-center">
          <img src={companyLogo} className="col-md-8 col-lg-6" alt="Company Logo" />
        </Col>
  
        <Col xs={12} md={6}>
          <HexagonBox backgroundColor="rgb(114, 0, 0)" textColor="white" padding="6rem 5rem">
            <div className="mt-5 mb-5 ml-3 mr-3">
              <Form onKeyDown={handleKeyDown} onSubmit={handleLogin} className="signin-form">
                <h2 className="text-center mb-3" style={{ fontSize: "2rem", fontWeight: "bold" }}>Log In</h2>
                
                {!isTwoFactorRequired && (
                  <>
                    <Form.Group className="mb-2">
                      <Form.Label>Email</Form.Label>
                      <Form.Control className="customInput" type="email" placeholder="Enter email" value={email.value} onChange={email.onChange} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Password</Form.Label>
                      <Form.Control className="customInput" type="password" placeholder="Enter password" value={password.value} onChange={password.onChange} />
                    </Form.Group>
                    <Button type="submit" className="w-100 btn loginButton mt-2">Sign In</Button>
                  </>
                )}

                {isTwoFactorRequired && (
                  <>
                    <Button 
                      onClick={sendVerificationCode} 
                      className="mt-2 w-100 loginButton" 
                      disabled={isButtonDisabled}
                    >
                      {isButtonDisabled ? `Resend in ${countdown}s` : "Send Verification Code"}
                    </Button>
                    <Form.Group className="mt-2">
                      <Form.Label>Verification Code</Form.Label>
                      <Form.Control 
                        type="text"
                        ref={codeInputRef} // Attach the ref here
                        className="customInput"
                        placeholder="Enter the code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </Form.Group>
                    <Button onClick={verifyCode} className="mt-2 w-100 loginButton">Verify Code</Button>
                  </>
                )}
      
                <div id="recaptcha-container"></div>
                
                <div className="text-center mt-2">
                  <span style={{ cursor: "pointer", fontSize: "0.9rem" }} onClick={handleForgotPassword}>Forgot Password?</span>
                </div>
                <div className="text-center mt-1">
                  <span style={{ cursor: "pointer", fontSize: "0.9rem" }} onClick={changeToSignup}>Create New Account?</span>
                </div>
              </Form>
            </div>
          </HexagonBox>
        </Col>
      </Row>
    </Container>
  );
};

export default SignIn;