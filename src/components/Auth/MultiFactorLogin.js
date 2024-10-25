import React, { useState } from "react";
import { PhoneAuthProvider, PhoneMultiFactorGenerator } from "firebase/auth";

/**
 * STRATEGY PATTERN:
 * -----------------
 * 
 * Allows for interchangeable authentication strategies by selecting
 * a specific multi-factor authentication method (e.g., SMS, email).
 * This pattern enables switching between different verification 
 * strategies without altering the underlying structure of the component.
 * 
 * Each verification method can have unique requirements while
 * maintaining a consistent multi-factor login process.
 */
export default function MultiFactorLogin({ resolver, setUser }) {
  const [verificationCode, setVerificationCode] = useState("");

  const handleVerification = async () => {
    const phoneFactor = resolver.hints[0];  // Assuming first factor is phone
    const phoneAuthProvider = new PhoneAuthProvider();
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      {
        multiFactorHint: phoneFactor,
        session: resolver.session,
      },
      window.recaptchaVerifier
    );

    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
    const assertion = PhoneMultiFactorGenerator.assertion(cred);

    const userCredential = await resolver.resolveSignIn(assertion);
    setUser(userCredential.user);  // Successful 2FA login
  };

  return (
    <div>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="Enter verification code"
      />
      <button onClick={handleVerification}>Verify</button>
    </div>
  );
}
