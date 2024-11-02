import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Form, Button, ProgressBar, Container, Row, Col } from "react-bootstrap";
import HexagonBox from "../ui/HexagonBox"; 
import { displayError } from "../../utils";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import '../../styles/Login.css' // Specific Styles for Login.CSS

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
const SignUp = ({ changeToLogin }) => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [verificationId, setVerificationId] = useState(null);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true); // Add state for password matching

  const inputStyle = {
    height: '32px',
    width: '60%',
    padding: '0.25rem 0.5rem',
    fontSize: '0.9rem'
  };

  const labelStyle = {
    width: '100%',
    textAlign: 'left',
    paddingRight: '10%',
    fontSize: '0.9rem'
  };

  const auth = getAuth();
  const db = getFirestore();

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

  const checkPasswordStrength = (pass) => {
    const requirements = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*]/.test(pass),
    };

    setPasswordRequirements(requirements);

    const strength = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strength * 20);
  };

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      return toast.error("Please enter your phone number.");
    }

    if (typeof window !== "undefined") {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => {
          console.log("reCAPTCHA solved.");
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired.");
        },
      });
    }

    try {
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        `+${phoneNumber}`,
        window.recaptchaVerifier
      );
      setVerificationId(verificationId);
      setIsCodeSent(true);
      toast.success("Verification code sent to your phone.");
    } catch (error) {
      toast.error("Failed to send verification code. Please try again.");
      if (typeof window !== "undefined" && window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    }
  };

  const verifyAndCreateAccount = async (e) => {
    e.preventDefault();

    if (
      !firstname ||
      !lastname ||
      !handle ||
      !email ||
      !password ||
      !verificationId ||
      !code
    ) {
      return toast.error("Please fill in all the fields and verify your phone number.");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must meet all the requirements."
      );
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      await updateProfile(user, { displayName: `${firstname} ${lastname}` });

      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        userId: user.uid,
        fullname: `${firstname} ${lastname}`,
        handle,
        avatarUrl: user.photoURL || "",
        createdAt: serverTimestamp(),
        quickieCount: 0,
        followersCount: 0,
        followingCount: 0,
        followers: [],
        following: [],
        bio: "",
        location: "",
        website: "",
        bookmarks: [],
        likes: [],
      });

      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        localStorage.setItem("token", await user.getIdToken());
        localStorage.setItem("user", JSON.stringify(user));
      }

      toast.success("You are signed up and logged in");
    } catch (err) {
      console.error("Error signing up:", err);
      return displayError(err);
    }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" id="overallContainer">
      <Row className="d-flex align-items-center justify-content-center">
        <Col xs={12} >
          <HexagonBox backgroundColor="rgb(114, 0, 0)" textColor="white" padding="6rem 5rem">
            <div className="mt-5 mb-5 ml-3 mr-3">
              <h2 className="text-center mb-4 mt-5" style={{ fontSize: "1.8rem", fontWeight: "bold" }}>Sign Up</h2>

              <Form onSubmit={verifyAndCreateAccount} className="signup-form">
                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    className="customInput w-100"
                    placeholder="Enter first name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    className="customInput w-100"
                    placeholder="Enter last name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>Handle</Form.Label>
                  <Form.Control
                    type="text"
                    className="customInput w-100"
                    placeholder="Choose handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>Email</Form.Label>
                  <Form.Control
                    type="email"
                    className="customInput w-100"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>Phone</Form.Label>
                  <PhoneInput
                    country={'us'} // Set default country
                    disableCountryGuess // Disables automatic changes based on input
                    value={phoneNumber}
                    onChange={(phone) => setPhoneNumber(phone)}
                    disableCountryCode // Prevents editing of the country code
                    containerStyle={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      padding: '0.25rem',
                      position: 'relative',
                    }}
                    inputStyle={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem', // Add left padding to start input to the right of the flag
                    }}
                    buttonStyle={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      width: '2rem', // Set a fixed width for the dropdown button
                      borderRadius: '5px 0 0 5px',
                      cursor: 'pointer',
                      paddingRight: '0.5rem',
                    }}
                    dropdownClass="countryList"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>Password</Form.Label>
                  <div style={{width: '100%'}}>
                    <Form.Control
                      type="password"
                      className="customInput w-100"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{...inputStyle, width: '100%'}}
                    />
                    <ProgressBar now={passwordStrength} className="mt-1" style={{height: '4px'}} />
                    <div className="password-requirements mt-1">
                      <small className={passwordRequirements.length ? "text-success" : "text-danger"}>
                        ✓ 8+ chars
                      </small>
                      <small className={passwordRequirements.uppercase ? "text-success" : "text-danger"}>
                        ✓ Uppercase
                      </small>
                      <small className={passwordRequirements.lowercase ? "text-success" : "text-danger"}>
                        ✓ Lowercase
                      </small>
                      <small className={passwordRequirements.number ? "text-success" : "text-danger"}>
                        ✓ Number
                      </small>
                      <small className={passwordRequirements.special ? "text-success" : "text-danger"}>
                        ✓ Special
                      </small>
                    </div>
                  </div>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label style={labelStyle}>Confirm</Form.Label>
                  <Form.Control
                    type="password"
                    className="customInput w-100"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </Form.Group>

                <div className="d-flex justify-content-center mb-2">
                  <div id="recaptcha-container" style={{ transform: 'scale(0.9)', transformOrigin: '0 0' }}></div>
                </div>

                {!isCodeSent ? (
                  <div className="d-flex justify-content-center mt-3">
                    <Button
                      className="w-100 loginButton"
                      onClick={sendVerificationCode}
                      style={{height: '32px', fontSize: '0.9rem', padding: '0.25rem 0.5rem'}}
                      disabled={!passwordsMatch}  // Disable the button if passwords don't match
                    >
                      Create Account!
                    </Button>
                  </div>
                ) : (
                  <>
                    <Form.Group className="mb-3 d-flex align-items-center">
                      <Form.Label style={labelStyle}>Code</Form.Label>
                      <Form.Control
                        placeholder="Enter code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={inputStyle}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                      <Button 
                        variant="success" 
                        type="submit" 
                        className="w-60"
                        style={{height: '32px', fontSize: '0.9rem', padding: '0.25rem 0.5rem'}}
                        disabled={!passwordsMatch}  // Disable the button if passwords don't match
                      >
                        Verify and Sign Up
                      </Button>
                    </div>
                  </>
                )}
                <div className="text-center mt-3 mb-5">
                  <span style={{ cursor: "pointer", fontSize: '0.9rem' }} onClick={changeToLogin}>
                    Already have an account? Login
                  </span>
                </div>
              </Form>
            </div>
          </HexagonBox>
        </Col>
      </Row>
    </Container>
  );
};

export default SignUp;
