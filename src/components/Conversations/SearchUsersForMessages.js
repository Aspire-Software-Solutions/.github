import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { User } from "../WhoToFollow";
import CustomResponse from "../CustomResponse";
import Loader from "../Loader";

const Wrapper = styled.div`
  padding-top: 0.4rem;
`;

const SearchUsersForMessages = ({ searchTerm, onUserSelect }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    if (!searchTerm) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
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

        const querySnapshot = await getDocs(usersQuery);
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
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
    return <CustomResponse text="Start typing to search for users" />;
  }

  return (
    <Wrapper>
      {users.length ? (
        users.map((user) => (
          <div key={user.id} onClick={() => onUserSelect(user)}>
            <User user={user} />
          </div>
        ))
      ) : (
        <CustomResponse text="No user found, try a different search" />
      )}
    </Wrapper>
  );
};

export default SearchUsersForMessages;
