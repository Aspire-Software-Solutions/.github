import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  height: 70vh;
  font-size: 1.1rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;
/***
 * DESIGN PATTERN:
 * ---------------
 * NULL OBJECT PATTERN
 * 
 * Serves as a Null Object, for whenever
 * the search result is empty or null. 
 * This allows a consistant user interface for 
 * edge cases where a query DNE.
 */
const NoSearchResult = ({ text }) => (
  <Wrapper>
    <p>{text}</p>
  </Wrapper>
);

export default NoSearchResult;
