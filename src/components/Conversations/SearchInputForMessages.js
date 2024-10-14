import React, { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import styled from "styled-components";
import Loader from "../Loader"; // Use your existing loader component
import CustomResponse from "../CustomResponse";

const Wrapper = styled.div`
  padding-top: 0.4rem;
`;

const SearchInputForMessages = ({ onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
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
          const cleanTerm = searchTerm.slice(1); // Remove "@"
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

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) return <Loader />;

  return (
    <Wrapper>
      <input
        type="text"
        placeholder="Search for users..."
        value={searchTerm}
        onChange={handleChange}
      />
      {users.length > 0 ? (
        <ul>
          {users.map((user) => (
            <li key={user.id} onClick={() => onUserSelect(user)}>
              {user.firstname} {user.lastname} (@{user.handle})
            </li>
          ))}
        </ul>
      ) : (
        <CustomResponse text="No users found" />
      )}
    </Wrapper>
  );
};

export default SearchInputForMessages;
