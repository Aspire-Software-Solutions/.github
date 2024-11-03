import React, { useState, useEffect, useRef } from "react";
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
  PhoneMultiFactorGenerator,
  signInWithCredential
  

} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import '../../styles/Login.css'; // Specific Styles for Login.CSS

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
  const inputStyle = {
    height: '32px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.9rem',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: 'none',
    outline: 'none',
  };

  const labelStyle = {
    width: '100%',
    textAlign: 'left',
    paddingRight: '10%',
    fontSize: '0.9rem',
    color: 'white',
  };

  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  const [currentStep, setCurrentStep] = useState(1);
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);


  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const [verificationId, setVerificationId] = useState(null); 
  const [resolver, setResolver] = useState(null); 
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const codeInputRef = useRef(null); // Reference for the verification code input field

  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // State for disabling the button
  const [countdown, setCountdown] = useState(10); // Countdown timer state

  const [isVerified, setIsVerified] = useState(false); // Track if phone number is verified
  const [areFieldsDisabled, setAreFieldsDisabled] = useState(false); // Track if fields should be disabled

  // Disable fields and show Sign Up button if verified
  const disableFieldProps = isVerified ? { disabled: true } : {};

  const auth = getAuth();
  const db = getFirestore();

  // Combined validation checks for each step
  useEffect(() => {
    setIsStep1Valid(firstname && lastname && email);
  }, [firstname, lastname, email]);
  
  useEffect(() => {
    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
    setPasswordsMatch(password === confirmPassword);
    setIsStep2Valid(handle && allRequirementsMet && password && passwordsMatch);
  }, [handle, password, confirmPassword, passwordRequirements, passwordsMatch]);
  
  
  useEffect(() => {
    setIsStep3Valid(phoneNumber);
  }, [phoneNumber]);  

  const initializeRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, // MAKE THIS THE FIRST ARGUMENT OF ELSE EVERYTHING WILL BREAK!!!!!
        "recaptcha-container", 
        {
          size: "invisible", // Don't let the user see the reCaptcha logo
          callback: (response) => {
            console.log("reCAPTCHA solved.");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired.");
          },
        }
      );
    }
  };

  const validateFirstname = () => {
    if (!firstname) {
      toast.error("First name is required.");
      return false;
    }
    return true;
  };
  
  const validateLastname = () => {
    if (!lastname) {
      toast.error("Last name is required.");
      return false;
    }
    return true;
  };
  
  const validateEmail = () => {
    if (!email) {
      toast.error("Email is required.");
      return false;
    }
    return true;
  };
  
  const validateHandle = () => {
    if (!handle) {
      toast.error("Handle is required.");
      return false;
    }
    return true;
  };
  
  const validatePassword = () => {
    if (!password || !confirmPassword) {
      toast.error("Password and confirm password are required.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };
  
  const validatePhoneNumber = () => {
    if (!phoneNumber) {
      toast.error("Phone number is required.");
      return false;
    }
    return true;
  };

  const sendVerificationCode = async () => {
    initializeRecaptcha();
  
    console.log('Sending verification code to:', phoneNumber); // Debug log
    
    try {
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const id = await phoneAuthProvider.verifyPhoneNumber(
        phoneNumber, // This should be the full E.164 formatted number
        window.recaptchaVerifier
      );
      console.log('Verification ID received:', id); // Debug log
      setVerificationId(id);
      toast.success("Verification code sent to your phone.");
    
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
    
      codeInputRef.current?.focus();
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error("Failed to send verification code. Please try again.");
    
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };
  
  

  const verifyCode = async () => {
    console.log('Attempting to verify code. Verification ID:', verificationId); // Debug log
  
    if (!verificationId) {
      toast.error("Verification ID is missing.");
      return;
    }
  
    try {
      // Create a phone credential using the verification ID and the entered code
      const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, code);
  
      // At this stage, we only verify the credential; we do not sign in
      setIsVerified(true);
      toast.success("Phone number verified!");
      setAreFieldsDisabled(true);
      setIsStep3Valid(true);
  
      // Store this credential or use it when creating the user's account
      console.log("Phone credential verified and can be used during account creation.");
    } catch (error) {
      console.error("Error during verification:", error); // Log for more details
      toast.error("Invalid verification code. Please try again.");
    }
  };
   
  

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep === 1 && validateFirstname() && validateLastname() && validateEmail()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2 && validateHandle() && validatePassword()) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3 && validatePhoneNumber()) {
      sendVerificationCode();
      setCurrentStep(currentStep + 1);
    }
  };
  


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

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const verifyAndCreateAccount = async (e) => {
    e.preventDefault();

    if (
      !firstname ||
      !lastname ||
      !handle ||
      !email ||
      !password
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
        firstname: firstname,
        fullname: `${firstname} ${lastname}`,
        handle: handle,
        phoneNumber: phoneNumber,
        isAdmin: false,
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
        coverPhoto: ""
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
                
              {/* Progress Indicator */}
              <div className="progress-container d-flex justify-content-center mb-4">
                <div className={`progress-bar ${currentStep >= 1 ? 'active' : ''}`}></div>
                <div className={`progress-bar ${currentStep >= 2 ? 'active' : ''}`}></div>
                <div className={`progress-bar ${currentStep === 3 ? 'active' : ''}`}></div>
              </div>

              <Form onSubmit={handleNext} className="signup-form">
                {currentStep === 1 && (
                  <>
                    {/* Personal Info */}
                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter first name"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        onBlur={validateFirstname}
                        className="w-100 customInput"
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter last name"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        onBlur={validateLastname}
                        className="w-100 customInput"
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={validateEmail}
                        className="w-100 customInput"
                      />
                    </Form.Group>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Account Details */}
                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Handle</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Choose handle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="w-100 customInput"
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Password</Form.Label>
                      <div style={{ width: '100%' }}>
                        <Form.Control
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            checkPasswordStrength(e.target.value);
                          }}
                          className="w-100 customInput"
                        />
                        <ProgressBar
                          now={passwordStrength}
                          className="mt-1"
                          style={{
                            height: '4px',
                            backgroundColor: 'white',
                          }}
                        >
                          <ProgressBar
                            now={passwordStrength}
                            style={{
                              backgroundColor: passwordStrength < 40 ? 'orange' : passwordStrength < 80 ? 'yellow' : 'green',
                            }}
                          />
                        </ProgressBar>
                        
                        <div className="password-requirements mt-1" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                          <small className={passwordRequirements.length ? "text-success" : "text-danger"}>
                            ✓ 8+ characters
                          </small>
                          <small className={passwordRequirements.uppercase ? "text-success" : "text-danger"}>
                            ✓ Uppercase letter
                          </small>
                          <small className={passwordRequirements.lowercase ? "text-success" : "text-danger"}>
                            ✓ Lowercase letter
                          </small>
                          <small className={passwordRequirements.number ? "text-success" : "text-danger"}>
                            ✓ Number
                          </small>
                          <small className={passwordRequirements.special ? "text-success" : "text-danger"}>
                            ✓ Special character
                          </small>
                        </div>

                      </div>
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-100 customInput"
                      />
                    </Form.Group>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <PhoneInput
                      country={'us'}
                      disableCountryGuess
                      value={phoneNumber}
                      onChange={(phone, countryData) => {
                        // Update phone number without duplicating the country code
                        if (phone.startsWith(countryData.dialCode)) {
                          setPhoneNumber(`+${phone}`);
                        } else {
                          setPhoneNumber(`+${countryData.dialCode}${phone}`);
                        }
                      }}
                      disableCountryCode={false} // Ensure country code selection is allowed but not typed in manually
                      containerClass="phoneInputContainer"
                      inputClass="form-control"
                      buttonClass="flag-dropdown"
                      dropdownClass="countryList"
                      required
                      {...disableFieldProps}
                    />


                    <Button 
                      onClick={sendVerificationCode} 
                      className="mt-2 w-100 loginButton" 
                      disabled={isButtonDisabled || isVerified}
                    >
                      {isButtonDisabled ? `Resend in ${countdown}s` : "Send Verification Code"}
                    </Button>

                    <Form.Group className="mt-2">
                      <Form.Label>Verification Code</Form.Label>
                      <Form.Control 
                        type="text"
                        ref={codeInputRef}
                        className="customInput"
                        placeholder="Enter the code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        {...disableFieldProps}
                      />
                    </Form.Group>

                    <Button 
                      onClick={verifyCode} 
                      className="mt-2 w-100 loginButton"
                      disabled={isVerified}
                    >
                      Verify Code
                    </Button>
                  </>
                )}

                {/* WHERE RECAPTCHA CONTAINER WILL GO (SHOULDN'T MATTER SINCE IT'S INVISIBLE) */}
                <div id="recaptcha-container"></div>

                {currentStep < 3 && (
                  <div className="d-flex justify-content-between mt-4">
                    {currentStep > 1 && (
                      <Button onClick={handleBack} variant="secondary">Back</Button>
                    )}
                    <Button
                      className="w-100 loginButton"
                      type="submit"
                      disabled={
                        (currentStep === 1 && !isStep1Valid) ||
                        (currentStep === 2 && !isStep2Valid)
                      }
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Show "Sign Up" button only if phone number is verified */}
                {currentStep === 3 && isVerified && (
                  <Button 
                    onClick={verifyAndCreateAccount} 
                    className="mt-2 w-100 loginButton"
                    disabled={!isVerified} // Disable if not verified
                  >
                    Sign Up
                  </Button>
                )}

                <div className="text-center mt-3 mb-5">
                  <span style={{ cursor: "pointer" }} onClick={changeToLogin}>
                    Have an account? Login
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
