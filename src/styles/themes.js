// themes.js

export const lightTheme = {
  background: "#FFFFFF",
  bgHover: "#F5F8FA",
  primaryColor: "#17141A",
  secondaryColor: "#657786",
  accentColor: "#CA2055",
  tertiaryColor: "#CCD6DD",
  tertiaryColor2: "#F5F8FA",
  overlay: "rgba(147, 149, 150, 0.4)",
  font: "Poppins",
  bs1: "0 0 6px 3px rgba(0, 0, 0, 0.1)",
  // add new properties here if needed for the light theme
};

export const darkTheme = {
  background: "#5F0000", // Dark red for the main background
  bgHover: "#9B111E", // Slightly lighter dark red for hover effects
  primaryColor: "#FFFFFF", // White for primary text
  secondaryColor: "#CCCCCC", // Light gray for secondary text
  accentColor: "#FF0000", // Bright red for accents
  tertiaryColor: "#000000", // Black for tertiary elements
  tertiaryColor2: "#1A1A1A", // Dark gray for secondary backgrounds
  overlay: "rgba(0, 0, 0, 0.4)", // Black overlay with transparency
  font: "Poppins",
  bs1: "0 0 6px 3px rgba(0, 0, 0, 0.3)", // Adjusted shadow for dark theme

  // Additional properties for components
  inputBackground: "transparent", // Transparent input background
  placeholderColor: "rgba(255, 255, 255, 0.7)", // Lighter placeholder text
  focusColor: "#FF4500", // Orange-red for focus states
  titleColor: "#FFFFFF", // White for titles
  linkColor: "#FFFFFF", // White for links
  linkHoverColor: "#FF4500", // Orange-red for link hover states
};
