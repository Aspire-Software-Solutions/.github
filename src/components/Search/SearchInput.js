import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import useInput from "../../hooks/useInput";
import { displayError } from "../../utils";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"; // Firestore
import SearchResult from "./SearchResult";
import { useLocation } from 'react-router-dom';

const Wrapper = styled.div`
  margin: 1rem 0;
  margin-left: 1rem;

  input {
    height: 40px;
    width: 70%;
    border-radius: 30px;
    background: ${(props) => props.theme.tertiaryColor2};
    border: ${(props) => props.theme.tertiaryColor2};
    color: ${(props) => props.theme.secondaryColor};
    font-family: ${(props) => props.theme.font};
    font-size: 1rem;
    padding-left: 1.2rem;
  }

  @media screen and (max-width: 530px) {
    input {
      font-size: 0.9rem;
    }
  }
`;

const SearchInput = () => {
  const location = useLocation();
  const term = useInput("");
  const [searchQuickieData, setSearchQuickieData] = useState([]);
  const [searchUserData, setSearchUserData] = useState([]);
  const [searchQuickieLoading, setSearchQuickieLoading] = useState(false);
  const [searchUserLoading, setSearchUserLoading] = useState(false);
  const db = getFirestore(); // Initialize Firestore

  // Set term's initial value if a tag is available in sessionStorage
  useEffect(() => {
    const tag = sessionStorage.getItem("searchTag");
    if (tag) {
      term.setValue(tag); // Set search input to the stored tag
      sessionStorage.removeItem("searchTag"); // Clear stored tag after use
    }
  }, [term]);

  /**
   * DESIGN PATTERN:
   * ---------------
   * FACADE PATTERN
   * 
   * Provides a simplfiied interface to 
   * handle both, tag and user searches.
   * In other words, it encapsulates the search logic by 
   * ensuring the UI omly has to call handleSearch.
   */
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!term.value) {
      return toast.error("Enter something to search");
    }

    try {
      setSearchQuickieLoading(true);
      setSearchUserLoading(true);

      const quickiesRef = collection(db, "quickies");

      // Handle tag search if the term starts with #
      if (term.value.startsWith("#")) {
        const tagQuery = query(quickiesRef, where("tags", "array-contains", term.value));
        const tagSnapshot = await getDocs(tagQuery);
        const tagResults = tagSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSearchQuickieData(tagResults);
      } else {
        // Search by quickies (text)
        const quickiesQuery = query(
          quickiesRef,
          where("text", ">=", term.value),
          where("text", "<=", term.value + "\uf8ff")
        );
        const quickiesSnapshot = await getDocs(quickiesQuery);
        const quickieResults = quickiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSearchQuickieData(quickieResults);
      }

      // Search by users (handle or names)
      const usersRef = collection(db, "profiles");
      let usersQuery;

      if (term.value.startsWith("@")) {
        // If searching by handle, remove '@' for the query
        const cleanTerm = term.value.slice(1); // Remove '@'
        usersQuery = query(
          usersRef,
          where("handle", ">=", cleanTerm),
          where("handle", "<=", cleanTerm + "\uf8ff")
        );
      } else {
        // Search for full names if not using '@'
        usersQuery = query(
          usersRef,
          where("firstname", ">=", term.value),
          where("firstname", "<=", term.value + "\uf8ff")
        );
      }

      const userSnapshot = await getDocs(usersQuery);
      const userResults = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSearchUserData(userResults);

    } catch (err) {
      console.error("Search error:", err);  // Add logging for better debugging
      displayError(err);
    } finally {
      setSearchQuickieLoading(false);
      setSearchUserLoading(false);
      term.setValue(""); // Clear the search input after search
    }
  };

  return (
    <>
      <Wrapper>
        <form onSubmit={handleSearch}>
          <input
            placeholder="Search by tags or people"
            type="text"
            value={term.value}
            onChange={term.onChange}
          />
        </form>
      </Wrapper>
      <SearchResult
        searchQuickieLoading={searchQuickieLoading}
        searchUserLoading={searchUserLoading}
        quickies={searchQuickieData}
        users={searchUserData}
        searchTerm={term.value}  // Pass the search term to SearchResult
      />
    </>
  );
};

export default SearchInput;