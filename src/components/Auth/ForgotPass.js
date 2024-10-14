import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

const ForgotPass = ({ changeToLogin }) => {
  const [identifier, setIdentifier] = useState(""); // Email or username input
  const auth = getAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!identifier) {
      return toast.error("Please enter your email or username.");
    }

    try {
      // Logic to find the user by email or username
      const user = await findUserByEmailOrUsername(identifier);

      if (!user) {
        return toast.error("User not found. Please check your email or username.");
      }

      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent.");
      changeToLogin(); // Redirect back to login after successful email sending
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast.error("Failed to send reset email. Please try again.");
    }
  };

  const findUserByEmailOrUsername = async (identifier) => {
    // Here, implement logic to check if identifier is an email or a username
    // You might need to query your Firestore or Realtime Database to find the user
    // This is just a placeholder function.
    return { email: identifier }; // Mock return; replace with actual logic.
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center vh-100">
      <Row className="d-flex align-items-center justify-content-center" style={{ width: "100%" }}>
        <Col xs={12} md={6} className="p-4 border rounded shadow">
          <h2 className="text-center mb-4" style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Forgot Password</h2>
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label>Email or Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Reset Password
            </Button>
            <div className="text-center mt-3">
              <span style={{ cursor: "pointer" }} onClick={changeToLogin}>
                Remembered your password? Login
              </span>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPass;
