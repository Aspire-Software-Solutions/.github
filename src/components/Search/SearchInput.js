import React, { useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import useInput from "../../hooks/useInput";
import { displayError } from "../../utils";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"; // Firestore
import SearchResult from "./SearchResult";

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

const SearchInput = ({ searchContext }) => {
  const term = useInput("");
  const [searchQuickieData, setSearchQuickieData] = useState([]);
  const [searchUserData, setSearchUserData] = useState([]);
  const [searchQuickieLoading, setSearchQuickieLoading] = useState(false);
  const [searchUserLoading, setSearchUserLoading] = useState(false);

  const db = getFirestore();

  const handleSearch = async (e) => {
    e.preventDefault();

    // Ensure prefix is added based on the context
    let searchTerm = term.value;
    if (searchContext === "TAGS" && !term.value.startsWith("#")) {
      searchTerm = `#${term.value}`;
    } else if (searchContext === "USERS" && !term.value.startsWith("@")) {
      searchTerm = `@${term.value}`;
    }

    if (!searchTerm) {
      return toast.error("Enter something to search");
    }

    try {
      setSearchQuickieLoading(true);
      setSearchUserLoading(true);

      const quickiesRef = collection(db, "quickies");

      // Handle tag search if the term starts with #
      if (searchTerm.startsWith("#")) {
        const tagQuery = query(quickiesRef, where("tags", "array-contains", searchTerm));
        const tagSnapshot = await getDocs(tagQuery);
        const tagResults = tagSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSearchQuickieData(tagResults);
      } else {
        // Search by quickies (text)
        const quickiesQuery = query(
          quickiesRef,
          where("text", ">=", searchTerm),
          where("text", "<=", searchTerm + "\uf8ff")
        );
        const quickiesSnapshot = await getDocs(quickiesQuery);
        const quickieResults = quickiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSearchQuickieData(quickieResults);
      }

      // Search by users (handle or names)
      const usersRef = collection(db, "profiles");
      let usersQuery;

      if (searchTerm.startsWith("@")) {
        const cleanTerm = searchTerm.slice(1);
        usersQuery = query(
          usersRef,
          where("handle", ">=", cleanTerm),
          where("handle", "<=", cleanTerm + "\uf8ff")
        );
      } else {
        usersQuery = query(
          usersRef,
          where("firstname", ">=", searchTerm),
          where("firstname", "<=", searchTerm + "\uf8ff")
        );
      }

      const userSnapshot = await getDocs(usersQuery);
      const userResults = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSearchUserData(userResults);

    } catch (err) {
      console.error("Search error:", err);
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
            placeholder={`Search by ${searchContext === "TAGS" ? 'tags' : 'users'}`}
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
        searchTerm={term.value}
      />
    </>
  );
};

export default SearchInput;
