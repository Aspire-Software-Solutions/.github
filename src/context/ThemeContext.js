import React, { useState, createContext } from "react";
import { darkTheme, lightTheme } from "../styles/themes";

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(darkTheme); // Start with darkTheme for auth pages

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === darkTheme ? lightTheme : darkTheme;
      localStorage.setItem("theme", newTheme === darkTheme ? "dark" : "light");
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
