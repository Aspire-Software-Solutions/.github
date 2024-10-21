import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import Loader from "./Loader";
import Header from "./Header";
import Avatar from "../styles/Avatar";
import Follow from "./Profile/Follow";
import Button from "../styles/Button";
import CustomResponse from "./CustomResponse";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth"; // Firebase Auth


const defaultAvatarUrl = "/default-avatar.png"; // Default avatar

const Wrapper = styled.div`
  margin-left: 0.4rem;
  width: 350px;
  background: ${(props) => props.theme.tertiaryColor2};
  border-radius: 10px;

  div:last-child {
    border-bottom: none;
  }
`;

const UserWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1rem;
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  font-size: 0.9rem;

  button {
    align-self: flex-start;
  }

  .avatar-handle {
    display: flex;

    img {
      margin-right: 1rem;
    }
  }

  .handle-fullname {
    display: flex;
    flex-direction: column;

    span:first-child {
      font-weight: 500;
    }

    span.secondary {
      color: ${(props) => props.theme.secondaryColor};
    }
  }
`;

export const User = ({ user }) => {
  const currentUser = getAuth().currentUser;

  return (
    <UserWrapper>
      <div className="avatar-handle">
        <Link to={`/${user?.handle}`}>
          <Avatar src={user?.avatarUrl || defaultAvatarUrl} alt="avatar" /> {/* Use default avatar */}
        </Link>

        <div className="handle-fullname">
          <Link to={`/${user?.handle}`}>
            <span>{user?.fullname || 'Unknown User'}</span> {/* Avoid blank names */}
          </Link>
          <span className="secondary">@{user?.handle}</span>
        </div>
      </div>

      {user && user.userId !== currentUser?.uid ? ( // Ensure user is not the current user
        <Follow 
        sm
        className="action-btn"
        isFollowing={user?.isFollowing} // Pass isFollowing
        userId={user?.userId} // Pass userId
        />
      ) : (
        <Link to="/settings/profile">
          <Button sm outline className="action-btn">
            Edit Profile
          </Button>
        </Link>
      )}
    </UserWrapper>
  );
};


const WhoToFollow = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const db = getFirestore();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "profiles");

        const q = query(
        usersRef, 
        //where("userId", "!=", currentUser?.uid), // Exclude current user
        orderBy("createdAt", "desc"), // Sort by recent users (replace with appropriate timestamp field)
        limit(10)); // Limit to top 10 users

        const querySnapshot = await getDocs(q);
        
        const userList = querySnapshot.docs
          .map((doc) => ({
            ...doc.data(),
            id: doc.id,
            isSelf: doc.data().userId === currentUser?.uid, // Ensure correct "isSelf" logic
          }))
          .filter((user) => user.userId !== currentUser?.uid); // Exclude current user more reliably
        
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [db, currentUser]);

  if (loading) return <Loader />;

  return (
    <Wrapper>
      <Header>Who to follow</Header>
      {users.length ? (
        users.map((user) => (
          <User key={user.id} user={user} />
        ))
      ) : (
        <CustomResponse text="No suggestions at the moment" />
      )}
    </Wrapper>
  );
};

export default WhoToFollow;
