import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { User } from "../WhoToFollow";
import CustomResponse from "../CustomResponse";
import Loader from "../Loader";

const Wrapper = styled.div`
  padding-top: 0.4rem;
`;

const SearchResultUsers = ({ searchTerm }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const db = getFirestore();


  /***
   * DESIGN PATTERN:
   * ---------------
   * Observer Pattern
   * 
   * the useEffect hooks act like an Observer,
   * triggering fetchQuickiesByUsers whenever searchterm changes.
   * 
   * By having the observer pattern, the component continuously refreshes 
   * its data, ensuring results are modular, and reusable.
   */
  useEffect(() => {
    if (!searchTerm) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "profiles");

        // Fetch all users (or use limit if needed for performance)
        const querySnapshot = await getDocs(usersRef);
        //const querySnapshot = await getDocs(query(usersRef, limit(100))); // Fetch 100 users at a time
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Apply client-side filtering using regex
        const regex = new RegExp(searchTerm.split(" ").join("|"), "i");
        const filteredUsers = usersList.filter((user) =>
          regex.test(user.fullname || "") || regex.test(user.handle || "")
        );

        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, db]);

  if (loading) return <Loader />;

  if (!searchTerm) {
    return <CustomResponse text="Use the search bar to find users" />;
  }

  return (
    <Wrapper>
      {users.length ? (
        users.map((user) => <User key={user.id} user={user} />)
      ) : (
        <CustomResponse text="No user found, try a different search" />
      )}
    </Wrapper>
  );
};

export default SearchResultUsers;
