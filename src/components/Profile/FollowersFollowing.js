import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
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

const PRESENCE_TIMEOUT = 2 * 60 * 1000;

const FollowersFollowing = () => {
  const { handle, type } = useParams();
  const [users, setUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const rtdb = getDatabase();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const profilesRef = collection(db, "profiles");
        const profileQuery = query(profilesRef, where("handle", "==", handle));
        const profileSnap = await getDocs(profileQuery);

        if (!profileSnap.empty) {
          const profileData = profileSnap.docs[0].data();
          const userIds = type === "followers" ? profileData.followers : profileData.following;

          if (userIds && userIds.length > 0) {
            const fetchedUsers = [];
            const batchSize = 10;

            for (let i = 0; i < userIds.length; i += batchSize) {
              const batch = userIds.slice(i, i + batchSize);
              const usersQuery = query(profilesRef, where("userId", "in", batch));
              const usersSnap = await getDocs(usersQuery);
              usersSnap.forEach((doc) => {
                const userData = doc.data();
                fetchedUsers.push({
                  ...userData,
                  showActiveStatus: userData.showActiveStatus !== undefined ? userData.showActiveStatus : true,
                });
              });
            }

            setUsers(fetchedUsers);
          } else {
            setUsers([]);
          }
        } else {
          console.error("Profile not found.");
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users: ", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [handle, type, db]);

  useEffect(() => {
    if (!users.length) return;

    const unsubscribes = [];

    users.forEach((user) => {
      if (user.showActiveStatus) {
        const statusRef = ref(rtdb, `/status/${user.userId}`);
        const unsubscribe = onValue(statusRef, (snapshot) => {
          const data = snapshot.val();
          const isActive = data?.state === "online";
            
          setUserStatuses((current) => ({
            ...current,
            [user.userId]: {
              isActive,
              lastChanged: data?.last_changed,
            },
          }));
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [users, rtdb]);

  if (loading) return <Loader />;

  return (
    <Wrapper>
      <h2>{type === "followers" ? "Followers" : "Following"}</h2>
      <div className="user-list">
        {users.length ? (
          users.map((user) => (
            <div key={user.userId} className="user-item">
              <Avatar 
                src={user.avatarUrl || "/default-avatar.png"} 
                alt={user.handle}
                showStatus={user.showActiveStatus}
                isActive={userStatuses[user.userId]?.isActive || false}
              />
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