import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"; // Firestore imports
import Loader from "../Loader";
import Avatar from "../../styles/Avatar";

const Wrapper = styled.div`
  padding: 2rem;

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 1rem;

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-handle {
      color: ${(props) => props.theme.secondaryColor};
    }
  }
`;

const FollowersFollowing = () => {
  const { handle, type } = useParams(); // 'type' will be either 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch the profile document based on the handle
        const profilesRef = collection(db, "profiles");
        const profileQuery = query(profilesRef, where("handle", "==", handle));
        const profileSnap = await getDocs(profileQuery);

        if (!profileSnap.empty) {
          const profileData = profileSnap.docs[0].data(); // Get the first matching document

          const userIds =
            type === "followers" ? profileData.followers : profileData.following;

          if (userIds && userIds.length > 0) {
            // Fetch the profiles of the followers/following users based on userId field
            const fetchedUsers = [];
            const batchSize = 10; // Firestore 'in' query limit

            for (let i = 0; i < userIds.length; i += batchSize) {
              const batch = userIds.slice(i, i + batchSize);

              const usersQuery = query(
                profilesRef,
                where("userId", "in", batch)
              );

              const usersSnap = await getDocs(usersQuery);
              usersSnap.forEach((doc) => {
                fetchedUsers.push(doc.data());
              });
            }

            setUsers(fetchedUsers);
          } else {
            setUsers([]); // No users found in the list
          }
        } else {
          console.error("Profile not found.");
          setUsers([]); // Profile not found case
        }
      } catch (error) {
        console.error("Error fetching users: ", error);
        setUsers([]); // Error case
      }
      setLoading(false);
    };

    fetchUsers();
  }, [handle, type, db]);

  if (loading) return <Loader />;

  return (
    <Wrapper>
      <h2>{type === "followers" ? "Followers" : "Following"}</h2>
      <div className="user-list">
        {users.length ? (
          users.map((user) => (
            <div key={user.userId} className="user-item">
              <Avatar src={user.avatarUrl || "/default-avatar.png"} alt={user.handle} />
              <div className="user-info">
                <Link to={`/${user.handle}`}>
                  <span>
                    {user.firstname} {user.lastname}
                  </span>
                  <span className="user-handle">{`@${user.handle}`}</span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </Wrapper>
  );
};

export default FollowersFollowing;
