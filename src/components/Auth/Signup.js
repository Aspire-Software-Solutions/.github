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

  const sendVerificationCode = async () => {
    // Mock implementation for sending verification code
    toast.success("Verification code sent.");
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
                    {/* Verification */}
                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Phone</Form.Label>
                      <PhoneInput
                        country={'us'}
                        disableCountryCode
                        value={phoneNumber}
                        onChange={(phone) => setPhoneNumber(phone)}
                        containerStyle={{ width: '100%' }}
                        inputStyle={inputStyle}
                      />
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label style={labelStyle}>Verification Code</Form.Label>
                      <Form.Control
                        placeholder="Enter verification code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={inputStyle}
                      />
                    </Form.Group>
                  </>
                )}

                <div className="d-flex justify-content-between mt-4">
                  {currentStep > 1 && (
                    <Button onClick={handleBack} variant="secondary">Back</Button>
                  )}
                  <Button
                    className="w-100 loginButton"
                    type="submit"
                    disabled={
                      (currentStep === 1 && !isStep1Valid) ||
                      (currentStep === 2 && !isStep2Valid) ||
                      (currentStep === 3 && !isStep3Valid)
                    }
                  >
                    {currentStep === 3 ? 'Sign Up' : 'Next'}
                  </Button>

                </div>
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
