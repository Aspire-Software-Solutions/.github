import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/Login.css' // Specific Styles for Login.CSS
import HexagonBox from "../ui/HexagonBox";

/**
 * OBSERVER PATTERN:
 * -----------------
 * 
 * The Observer Pattern is used to monitor changes in the password 
 * input field, dynamically updating the password strength indicator 
 * based on changes.
 * 
 * By observing changes to the password field, the UI can reactively 
 * display password strength feedback to enhance user experience.
 */
const ForgotPass = ({ changeToLogin }) => {
  const [identifier, setIdentifier] = useState(""); // Email or username input
  const auth = getAuth();

  // Function to call reset password request (from button)
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Ensure input exists
    if (!identifier) {
      return toast.error("Please enter your email or username.");
    }

    try {
      // Logic to find the user by email or username
      const user = await findUserByEmailOrUsername(identifier);

      if (!user) {
        return toast.error("User not found. Please check your email or username.");
      }

      // Use Firebase to send reset email to user
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset sent to your email if the account exists.");
      changeToLogin(); // Redirect back to login after successful email sending
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast.error("Failed to send reset email. Please try again.");
    }
  };

  // TODO: IF WE WISH TO EXPAND FURTHER!
  const findUserByEmailOrUsername = async (identifier) => {
    // Here, implement logic to check if identifier is an email or a username
    // You might need to query your Firestore or Realtime Database to find the user
    // This is just a placeholder function.
    return { email: identifier }; // Mock return; replace with actual logic.
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" id="overallContainer">
      <Row className="d-flex align-items-center justify-content-center">
        <Col xs={12}>
          <HexagonBox backgroundColor="rgb(114, 0, 0)" textColor="white" padding="6rem 5rem">
            <div className="mt-5 mb-5 ml-3 mr-3">
              
              {/* HEADER */}
              <h2 className="text-center mb-4" style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Forgot Password</h2>
              
              {/* RESET FORM */}
              <div style={{ marginLeft: '2rem', marginRight: '2rem' }}>
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Email</Form.Label>
                    <Form.Control
                      type="text"
                      className="customInput"
                      placeholder="Enter your email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 loginButton">
                    Reset Password
                  </Button>
                  <div className="text-center mt-3 mb-5">
                    <span style={{ cursor: "pointer" }} onClick={changeToLogin}>
                      Remembered your password? Login
                    </span>
                  </div>
                </Form>
              </div>
            </div>
          </HexagonBox>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPass;
