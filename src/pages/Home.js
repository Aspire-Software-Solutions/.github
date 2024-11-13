import React from "react";
import styled from "styled-components";
import FeedList from "../components/FeedList";
import NewQuickie from "../components/Quickie/NewQuickie"; // Updated component import
import Header from "../components/Header";

const Wrapper = styled.div``;

const Home = () => {
  return (
    <Wrapper>
      {<Header>
        <span>Home</span>
      </Header> }
      <NewQuickie /> {/* Updated component name */}
      <FeedList /> {/* This should now handle quickies correctly */}
    </Wrapper>
  );
};

export default Home;
