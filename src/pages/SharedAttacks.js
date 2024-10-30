// src/pages/SharedAttacks.js
import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Quickie from "../components/Quickie/Quickie";
import QuickieIdSearchAdapter from "../components/Search/QuickieIdSearchAdapter";

const Wrapper = styled.div`
  margin-bottom: 7rem;
`;

const SharedAttacks = () => {
  const { quickieId } = useParams();

  return (
    <Wrapper>
      {quickieId ? (
        <Quickie quickieId={quickieId} readOnly />
      ) : (
        <>
          <h2>Search for a Quickie by ID</h2>
          <QuickieIdSearchAdapter />
        </>
      )}
    </Wrapper>
  );
};

export default SharedAttacks;
