import React, { useState, createContext } from "react";
import { darkTheme, lightTheme } from "../styles/themes";

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const localSt = localStorage.getItem("theme");
    return localSt ? (localSt === "dark" ? darkTheme : lightTheme) : darkTheme;
  };

  const [theme, setTheme] = useState(getInitialTheme);

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
