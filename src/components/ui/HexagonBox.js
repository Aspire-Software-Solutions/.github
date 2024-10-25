import React from "react";
import { Container } from "react-bootstrap";

/***
 * DESIGN PATTERN:
 * ---------------
 * DECORATOR PATTERN
 */
const HexagonBox = ({ 
  children, 
  backgroundColor = "rgb(114, 0, 0)", 
  textColor = "white", 
  maxWidth = "90vw", 
  maxHeight = "90vh",
  padding = "2rem 1.5rem"
}) => {
  return (
    <Container fluid className="d-flex align-items-center justify-content-center vh-100">
      <div className="hexagon-box" style={{ 
        "--background-color": backgroundColor,
        "--text-color": textColor,
        "--max-width": maxWidth,
        "--max-height": maxHeight,
        "--padding": padding
      }}>
        {children}
      </div>
    </Container>
  );
};

export default HexagonBox;