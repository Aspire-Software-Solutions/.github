import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Form, Button, ProgressBar, Container, Row, Col, Modal } from "react-bootstrap";
import HexagonBox from "../ui/HexagonBox"; 
import { displayError } from "../../utils";
import {
  getAuth,
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
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

  // Custom Styling for this page
  const labelStyle = {
    width: '100%',
    textAlign: 'left',
    paddingRight: '10%',
    fontSize: '0.9rem',
    color: 'white',
  };

  /**
   * NAVIGATION FOR SIGNUP:
   * ----------------------
   * Due to the constraints posed by HexagonBox, a "step structure" has been implemented.
   * This means that instead of the user seeing the form in its entirety, it's broken 
   * up into 'steps'. The first step is the personal information, the second step 
   * is account information, and the third step is validation.
   * 
   * These variables below control what step in the form the user is at, allowing 
   * for both, forwards and backwards movement.
   */
  const [currentStep, setCurrentStep] = useState(1);
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);

  /**
   * CHECKING INPUT VALIDATION:
   * ----------------
   * These variables below determine whether certain criteria are met:
   * For example, we want to ensure no two people have the same handle or email:
   */
  const [isHandleValid, setIsHandleValid] = useState(false);

  /**
   * MODAL WARNING:
   * --------------
   * There is a weird bug in the reCAPTCHA where if the user inputs an invalid 
   * phone number, the reCAPTCHA doesn't work, and subsequent attempts say 
   * "ERROR: reCAPTCHA has already been rendered in this element."
   * 
   * The way this error doesn't trigger is if the user inputs a valid phone number,
   * and keeps inputting valid phone numbers.
   * 
   * If the recaptcha bug does occur, we must reload the page.
   * 
   * This modal tells the user that they must reload the page.
   */
  const [showBotWarningModal, setShowBotWarningModal] = useState(false);

  /**
   * VARIABLES USED FOR SIGNING UP:
   * ------------------------------
   * This stores the user information needed so we can 
   * create the users account.
   */
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  /**
   * PASSWORD REGEX:
   * ---------------
   * This is the format that the password must have in order to be considered valid.
   * For simplicity sake it must:
   * (?=.*[A-Z]): The password must contain at least one uppercase letter (A-Z).
   * (?=.*[a-z]): The password must contain at least one lowercase letter (a-z).
   * (?=.*[0-9]): The password must contain at least one digit (0-9).
   * (?=.*[!@#$%^&*]): The password must contain at least one special character from the set !@#$%^&*.
   * .{8,}: The password must be at least 8 characters long.
  */
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

  /**
   * CHECKING PASSWORDS:
   * -------------------
   * This is used to check and ensure that the password meets the passwordRegex 
   * requirements, and that both the initial and confirmation passwords match. 
   */
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  /**
   * PHONE VERIFICATION:
   * -------------------
   * These variables and states below all relate to the phone verification (step 3)
   * of the sign up process. The user will get a verification code sent to their phone,
   * after which they have to input it and ensure that the code matches.
   */
  const [verificationId, setVerificationId] = useState(null); 
  const [resolver, setResolver] = useState(null);  // USED TO VERIFY CODE (DOESN'T WORK)
  const [selectedIndex, setSelectedIndex] = useState(0); // USED TO VERIFY CODE (DOESN'T WORK)
  const codeInputRef = useRef(null); // Reference for the verification code input field
  const [isVerified, setIsVerified] = useState(false); // Track if phone number is verified
  const [areFieldsDisabled, setAreFieldsDisabled] = useState(false); // Track if fields should be disabled

  /**
   * DISABLED BUTTONS AND COUNTDOWN:
   * -------------------------------
   * Because we cannot have nice things, people have already tried to overload the server.
   * As a result, anytime a verification code has been sent, there's a cooldown on when
   * the user can send another request.
   * 
   * Furthermore, in the event that the code takes some time to reach the user, it allows the 
   * sever to receive less requests.
   */
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // State for disabling the button
  const [countdown, setCountdown] = useState(10); // Countdown timer state
  const disableFieldProps = isVerified ? { disabled: true } : {};   // Disable fields and show Sign Up button if verified
  
  /**
   * DEBOUNCE:
   * ---------
   * This variable is used to check variable states so we can save
   * on reads and writes.
   *  
   */
  let debounceTimeout; // TIMEOUT SO ON STEP 1, WE DON'T CALL THE validateEmail ON EVERY KEYSTROKE

  /**
   * FIREBASE CONNECTIONS:
   * ---------------------
   * Starting instance of firebase so we can create accounts!
   */
  const auth = getAuth();
  const db = getFirestore();

  /**
   * 
   * -----------------
   * VALIDATION STEPS!
   * -----------------
   * 
   */

  // CHECK TO SEE ALL REQUIREMENTS HAVE BEEN SATISFIED FOR STEP 1
  useEffect(() => {
    // Clear any existing timeout when the email changes
    clearTimeout(debounceTimeout);
  
    if (email) {
      // Set a new timeout for email validation after 3 seconds of inactivity
      debounceTimeout = setTimeout(async () => {
        const isEmailValid = await validateEmail(email);
        setIsStep1Valid(isEmailValid && firstname && lastname && email);
      }, 1500); // 3-second delay
    } else {
      setIsStep1Valid(false);
    }
  
    // Cleanup function to clear the timeout if the component unmounts or re-renders
    return () => clearTimeout(debounceTimeout);
  }, [email, firstname, lastname]);


  // CHECK TO SEE IF ALL REQUIREMENTS HAVE BEEN SATISFIED FOR STEP 2
  useEffect(() => {
    const checkValidity = async () => {
      const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
      setPasswordsMatch(password === confirmPassword);
  
      if (handle) {
        const isHandleValidResult = await validateHandle();
        setIsHandleValid(isHandleValidResult);
      }
  
      setIsStep2Valid(isHandleValid && allRequirementsMet && password && passwordsMatch);
    };
  
    checkValidity();
  }, [handle, password, confirmPassword, passwordRequirements, passwordsMatch, isHandleValid]);
  
  
  // CHECK TO SEE IF ALL REQUIREMENTS HAVE BEEN SATISFIED FOR STEP 3
  useEffect(() => {
    setIsStep3Valid(phoneNumber);
  }, [phoneNumber]);  

  /**
   * RECAPTCHA:
   * ----------
   * THIS S.O.A.B IS THE WORST THING THAT EXISTS IN HUMAN HISTORY.
   * THIS HAS SUCH SHITTY DOCUMENTATION AND NO SUPPORT.
   * THE ERRORS IT GIVES OUT DON'T MEAN ANYTHING, AND NOT EVEN GOOGLE CLOUD
   * COMPUTE RECAPTCHA SUPPORT COULD HELP ME.
   * THERE ARE THINGS THAT I WANT TO IMPLEMENT BUT CANNOT BECAUSE THE DOCUMENTATION
   * IS SO SHITTY.
   * 
   * Anyways, this starts up the reCAPTCHA service that we need for 
   * sending SMS 2FA to a user signing up.
   */
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

  /**
   * 
   * ---------------------
   * VALIDATION FUNCTIONS:
   * ---------------------
   * I'm going to be honest, I don't know if they work
   * since sometimes I see them, other times I don't.
   * 
   * We shall still keep them since the only thing they throw out are
   * toast errors hehe.
   * 
   */

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
  
  const validateEmail = async () => {
    if (!email) {
      toast.error("Email is required.");
      return false;
    }
  
    console.log("Checking Email: ", email);

    // Basic regex to check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
  
    // Check if the email is already in use in Firebase Authentication
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        toast.error("Email is already in use. Please use a different email.");
        return false;
      }
  
      console.log("EMAIL IS NOT IN USE: WE CAN USE IT!")
      return true;
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error("An error occurred while validating the email. Please try again.");
      return false;
    }
  };
  
  const validateHandle = async () => {
    if (!handle) {
      toast.error("Handle is required.");
      return false;
    }
  
    // Check if the handle already exists in the database
    try {
      const querySnapshot = await getDocs(collection(db, "profiles"));
      const handleExists = querySnapshot.docs.some((doc) => doc.data().handle === handle);
  
      if (handleExists) {
        toast.error("Handle is already taken. Please choose another.");
        return false;
      }
  
      return true;
    } catch (error) {
      console.error("Error checking handle:", error);
      toast.error("An error occurred while validating the handle.");
      return false;
    }
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

  /**
   * 
   * DEBOUNCE FUNCTIONS:
   * -------------------
   * These are the functions that check whether a user has finished inputting 
   * something into the input box. If the user has left the box, check its validity.
   * If the user hasn't, wait for 3 seconds after the last keystroke to check!
   */

  // Debounced email change handler
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Clear the previous timeout
    clearTimeout(debounceTimeout);

    // Set a new timeout for 3 seconds
    debounceTimeout = setTimeout(async () => {
      if (newEmail) {
        const isEmailValid = await validateEmail(newEmail);
        setIsStep1Valid(isEmailValid && firstname && lastname && newEmail);
      }
    }, 3000); // 3-second delay
  };

  // Email validation on blur
  const handleEmailBlur = async () => {
    clearTimeout(debounceTimeout); // Clear any pending timeout to avoid double validation
    if (email) {
      const isEmailValid = await validateEmail(email);
      setIsStep1Valid(isEmailValid && firstname && lastname && email);
    }
  };

  /**
   * SENDING VERIFICATION CODE:
   * --------------------------
   * This function starts up the recaptcha service
   * and proceeds to send a code out to the user.
   * 
   * NOTE: IF THE CATCH STATEMENT EVER GETS CALLED,
   * RECAPTCHA BREAKS AND THE ONLY WAY TO FIX IS TO REFRESH THE PAGE.
   * 
   * DON'T ASK ME WHY OR HOW.
   */
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
  
      // Check for specific reCAPTCHA rendering error
      if (error.message.includes("reCAPTCHA has already been rendered in this element")) {
        setShowBotWarningModal(true);
      } 
      else if (error.message.includes("FirebaseError: Firebase: Error (auth/invalid-app-credential)")){
        setShowBotWarningModal(true);
      }else {
        toast.error("Failed to send verification code. Please try again.");
      }
  
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
  
      setVerificationId(null);
      setIsButtonDisabled(false);
      setCountdown(10);
    }
  };
  
  /**
   * Verification Code:
   * ------------------
   * This code ensures that the code the user input
   * is valid. Then, it enables the signup button to appear.
   */
  const verifyCode = async () => {
    console.log('Attempting to verify code. Verification ID:', verificationId); // Debug log
  
    if (!verificationId) {
      toast.error("Verification ID is missing.");
      return;
    }
  
    try {
      // Create a phone credential using the verification ID and the entered code
      const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, code);
  
      // THIS ACCEPTS ANY VALUE INPUT FOR THE VERIFICATION.
      // ON ONE HAND THATS ASS BECAUSE IT DOESN'T WORK
      // BUT IT ONLY SENDS A CODE TO VALID PHONE NUMBERS??
      // THE ONLY WAY TO CHECK IS TO DO A QUICK SIGN IN CHECK
      // BUT APPROUTER.JS WILL TAKE YOU TO THE HOME PAGE EVEN THOUGH
      // YOU DON'T HAVE AN ACCOUNT AND AREN'T AUTH.

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
   
  /**
   * NAVIGATION:
   * -----------
   * Code uses the Navigation variables (listed above) to 'actually' go 
   * forth through the three signup steps. 
   */
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
  

  /**
   * CHECKING PASSWORD:
   * ------------------
   * Logic for 'actually' checking the password strength that a user put in
   * using the variables (listed above). 
   * Also, this function updates a password strength progress bar,
   * ensuring that the user knows what their password needs to pass.
   */
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

    /**
   * NAVIGATION:
   * -----------
   * Code uses the Navigation variables (listed above) to 'actually' go 
   * BACK through the three signup steps. 
   */
  const handleBack = () => {
    setCurrentStep(currentStep - 1);

    // Reset any fields or states specific to step 3 if necessary
    if (currentStep === 3 && !isVerified) {
      setPhoneNumber(""); // Clear the phone number field if needed
      setVerificationId(null); // Reset the verification ID
      setIsVerified(false); // Reset verification status
      setAreFieldsDisabled(false); // Re-enable the fields
    }
  };

  /**
   * SIGNING USER UP:
   * ----------------
   * This function 'actually' creates the users profile and logs them into
   * the website. 
   * 
   * The function first re-validates that all the information is accurate, correct,
   * and all fields are filled in.
   * 
   * Then it creates the firebase account, and logs the user in.
   */
  const verifyAndCreateAccount = async (e) => {
    e.preventDefault();

    // CHECK TO ENSURE ALL FIELDS ARE FILLED IN
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

    // CREATE USER ACCOUNT
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

      // LOG USER IN IF ACCOUNT IS SUCCESSFULLY CREATED
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
                {/**
                 * FIRST STEP IN SIGNING UP
                 */}
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
                        onBlur={handleEmailBlur}
                        className="w-100 customInput"
                      />
                    </Form.Group>
                  </>
                )}

                {/**
                 * SECOND STEP IN SIGNING UP:
                 */}
                {currentStep === 2 && (
                  <>
                  <div style={{ marginLeft: '2rem', marginRight: '2rem' }}>
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
                  </div>
                  </>
                )}

                {/**
                 * THIRD STEP IN SIGNING UP
                 */}
                {currentStep === 3 && (
                  <>
                  <div style={{ marginLeft: '2rem', marginRight: '2rem' }}>
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
                      buttonClass="flag-dropdown"
                      dropdownClass="countryList"
                      required
                      {...disableFieldProps}
                      inputStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        paddingLeft: '55px',
                      }}

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
                        disabled={!verificationId || isVerified}
                      />
                    </Form.Group>

                    <Button 
                      onClick={verifyCode} 
                      className="mt-2 w-100 loginButton"
                      disabled={!verificationId || isVerified}
                    >
                      Verify Code
                    </Button>
                  </div>
                  </>
                )}

                {/* WHERE RECAPTCHA CONTAINER WILL GO (SHOULDN'T MATTER SINCE IT'S INVISIBLE) */}
                <div id="recaptcha-container"></div>

                {/**
                 * NAVIGATION BUTTONS
                 */}
                {currentStep >= 1 && (
                  <div className="d-flex justify-content-between mt-4" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                    {(currentStep > 1)&& (
                      <Button onClick={handleBack} variant="secondary">Back</Button>
                    )}
                    {(currentStep < 3)&& (
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
                    )}
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
                  <span style={{ cursor: "pointer" }}
                    onClick={() => {
                      // Force a page reload to clear reCAPTCHA and reset the component state
                      window.location.reload();
                      changeToLogin();
                    }}>
                    Have an account? Login
                  </span>
                </div>
              </Form>
            </div>
          </HexagonBox>
        </Col>
      </Row>

      {/* Modal for bot warning */}
      <Modal show={showBotWarningModal} onHide={() => setShowBotWarningModal(false)} style={{ color: 'black' }}>
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>We detected suspicious behavior due to an invalid phone number submission. If you are not a bot, please refresh the page and try again.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SignUp;
