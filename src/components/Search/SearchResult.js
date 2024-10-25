import React, { useState } from "react";
import styled from "styled-components";
import SearchResultTags from "./SearchResultTags";
import SearchResultUsers from "./SearchResultUsers";

const Wrapper = styled.div`
  .tabs {
    display: flex;
    justify-content: space-around;
    border-bottom: 2px solid ${(props) => props.theme.tertiaryColor};
  }

  span {
    cursor: pointer;
    margin-bottom: 0.4rem;
  }

  span.active {
    border-bottom: 2px solid ${(props) => props.theme.accentColor};
    font-weight: 500;
    color: ${(props) => props.theme.accentColor};
  }
`;

const SearchResult = ({
  searchQuickiesLoading,
  searchUserLoading,
  searchTagLoading,
  tags,
  users,
  quickies,
  searchTerm  // Pass the search term for filtering
}) => {

  /**
   * STRAGETY PATERN:
   * ----------------
   * 
   * Dynamically switches between Tags and User 
   * display views based on the searchResultAction state.
   * 
   * More detailed, the searchResultAction defines which stragety
   * to use (tags or users)
   * 
   * This seperatiopn allows for different search results,
   * and flexbility in adding additional functionality to each type of
   * search, or adding more types of search. 
   */
  const [searchResultAction, setSearchResultAction] = useState("TAGS");

  const changeToTags = () => setSearchResultAction("TAGS");
  const changeToUsers = () => setSearchResultAction("USERS");

  return (
    <Wrapper>
      <div className="tabs">
        <span
          className={searchResultAction === "TAGS" ? "active" : ""}
          onClick={changeToTags}
        >
          Tags
        </span>
        <span
          className={searchResultAction === "USERS" ? "active" : ""}
          onClick={changeToUsers}
        >
          Users
        </span>
      </div>
      {searchResultAction === "TAGS" && (
        <SearchResultTags tags={tags} loading={searchTagLoading} searchTerm={searchTerm} />
      )}
      {searchResultAction === "USERS" && (
        <SearchResultUsers users={users} searchTerm={searchTerm} loading={searchUserLoading} />
      )}
    </Wrapper>
  );
};

export default SearchResult;