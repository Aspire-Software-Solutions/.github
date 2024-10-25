import React, { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import styled from "styled-components";
import Loader from "../Loader";
import CustomResponse from "../CustomResponse";
import Quickie from "../Quickie/Quickie";
import { getFirestore, collection, getDocs } from "firebase/firestore"; // Firestore

const Wrapper = styled.div`
  position: relative;
`;

// Custom hook to get query parameters from URL
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SearchResultTags = ({ searchTerm = ""}) => {
  const [loading, setLoading] = useState(false);
  const [quickies, setQuickies] = useState([]);
  const db = getFirestore(); // Initialize Firestore
  const query = useQuery().get('query') || searchTerm; // Default to searchTerm if no query param

  useEffect(() => {
    if (query) {
      // Use the query to perform a search or filter as needed
      console.log('Searching for:', query);
      // Call any relevant function to fetch data based on the query
    }
  }, [query]);

  /***
   * DESIGN PATTERN:
   * ---------------
   * Observer Pattern
   * 
   * the useEffect hooks act like an Observer,
   * triggering fetchQuickiesByTags whenever searchterm changes.
   * 
   * By having the observer pattern, the component continuously refreshes 
   * its data, ensuring results are modular, and reusable.
   */
  useEffect(() => {
    if (!searchTerm) {
      setQuickies([]);
      return;
    }

    const fetchQuickiesByTag = async () => {
      setLoading(true);
      try {
        const quickiesRef = collection(db, "quickies");

        // Fetch all quickies (or use limit for performance)
        const querySnapshot = await getDocs(quickiesRef);
        const quickiesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Apply client-side filtering using regex
        const regex = new RegExp(searchTerm.split(" ").join("|"), "i");
        const filteredQuickies = quickiesList.filter(
          (quickie) => Array.isArray(quickie.tags) && quickie.tags.some((tag) => regex.test(tag))
        );

        setQuickies(filteredQuickies);
      } catch (error) {
        console.error("Error fetching quickies by tag:", error);
        setQuickies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickiesByTag();
  }, [searchTerm, db]);

  if (loading) return <Loader />;

  if (!searchTerm) {
    return <CustomResponse text="Use the search bar to find attacks by tags" />;
  }

  return (
    <Wrapper>
      {quickies.length ? (
        quickies.map((quickie) => <Quickie key={quickie.id} quickie={quickie} />)
      ) : (
        <CustomResponse text="No quickies found, try a different search" />
      )}
    </Wrapper>
  );
};

export default SearchResultTags;
