import React, { useContext } from "react";
import { toast } from "react-toastify";
import { UserIcon } from "../Icons";
import { ThemeContext } from "../../context/ThemeContext";
import { Wrapper } from "../ToggleTheme";
import { getAuth, signOut } from "firebase/auth"; // Firebase import

/**
 * COMMAND PATTERN:
 * ----------------
 * 
 * Encapsulates the logout action as a command, which can be executed 
 * independently. This pattern is useful for encapsulating operations 
 * like logout that can be executed or undone in response to 
 * user actions.
 * 
 * By organizing logout as a command, it becomes easier to implement 
 * actions such as delayed execution or other post-logout processes.
 */
const Logout = () => {
  const { theme } = useContext(ThemeContext);
  const auth = getAuth(); // Initialize Firebase Auth

  const handleLogout = async () => {
    try {
      // Firebase sign out
      await signOut(auth);
      
      // Clear localStorage
      localStorage.clear();
      
      // Show success message and redirect
      toast.success("You are logged out");
      setTimeout(() => {
        window.location = "/";
      }, 2100);
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    }
  };

  return (
    <Wrapper onClick={handleLogout}>
      <UserIcon sm color={theme.accentColor} />
      <p>Logout</p>
    </Wrapper>
  );
};

export default Logout;
