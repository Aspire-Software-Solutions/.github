import React, { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import { ThemeContext } from "../context/ThemeContext";
import { lightTheme, darkTheme } from "../styles/themes";

export const Wrapper = styled.div`
  display: flex;
  align-items: baseline;
  margin-left: 0.7rem;
  margin-bottom: 1rem;
  cursor: pointer;

  p {
    margin-left: 0.4rem;
    margin-bottom: 0; /* Ensure margin consistency */
    color: white;
  }

  &:hover p {
    color: ${(props) => props.theme.accentColor}; /* Highlight text on hover */
  }
`;

const ToggleTheme = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [currentTheme, setCurrentTheme] = useState(() =>
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && savedTheme !== currentTheme) {
      setTheme(savedTheme === "dark" ? darkTheme : lightTheme);
    }
  }, [currentTheme, setTheme]);

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme === "dark" ? darkTheme : lightTheme);
    localStorage.setItem("theme", newTheme);
    setCurrentTheme(newTheme);
  };

  return (
    <Wrapper onClick={toggleTheme} aria-label="Toggle Theme">
      <p>{currentTheme === "dark" ? "Light Theme" : "Dark Theme"}</p>
    </Wrapper>
  );
};

export default ToggleTheme;
