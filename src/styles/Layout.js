import styled from "styled-components";
import React from "react";
import { useLocation } from "react-router-dom";
import Suggestion from "../pages/Suggestion"; // Assuming Suggestion component is in pages

const Wrapper = styled.div`
  padding-top: 4.5rem;
  margin-left: 14.6%;
  display: grid;
  grid-template-columns: 65% 1fr;

  @media screen and (max-width: 1110px) {
    grid-template-columns: 1fr;
    margin-left: 10%;
  }

  @media screen and (max-width: 530px) {
    margin-left: 0;
    grid-template-columns: 1fr;
  }
`;

const Layout = ({ children }) => {
  const location = useLocation(); // Get current route

  return (
    <Wrapper>
      {children}
      {/* Conditionally render Suggestion only on the /explore route */}
      {location.pathname === "/explore" && <Suggestion />}
    </Wrapper>
  );
};

export default Layout;
