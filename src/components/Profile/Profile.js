import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";
import ProfileInfo from "./ProfileInfo";
import Quickie from "../Quickie/Quickie";
import Loader from "../Loader";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore"; // Firestore imports

const Wrapper = styled.div`
  padding-bottom: 5rem;

  .profile-top {
    display: flex;
    flex-direction: column;
    margin-left: 1rem;

    span.quickieCount {
      margin-top: 0.1rem;
      color: ${(props) => props.theme.secondaryColor};
      font-size: 0.9rem;
    }
  }
`;

const Profile = () => {
  const { handle } = useParams(); // Get the profile handle from the URL
  const [profileData, setProfileData] = useState(null);
  const [quickies, setQuickies] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(); // Initialize Firestore

  useEffect(() => {
    const fetchProfileAndQuickies = () => {
      setLoading(true);

      // Real-time listener for profile data
      const profileQuery = query(collection(db, "profiles"), where("handle", "==", handle));

      /**
       * OBSERVER PATTERN:
       * -----------------
       * 
       * Observes real-time updates to profile and followers data.
       * By subscribing to `onSnapshot`, it listens for any changes 
       * and automatically updates the UI, ensuring that the latest 
       * profile or followers information is displayed.
      */
      onSnapshot(profileQuery, (profileSnapshot) => {
        if (!profileSnapshot.empty) {
          const profileDoc = profileSnapshot.docs[0];
          setProfileData(profileDoc.data());

          // Fetch the user's quickies in real-time, ordered by createdAt in descending order
          const quickiesQuery = query(
            collection(db, "quickies"),
            where("userId", "==", profileDoc.data().userId),
            orderBy("createdAt", "desc") // Ensure the posts are ordered newest to oldest
          );

          onSnapshot(quickiesQuery, (quickiesSnapshot) => {
            const quickiesList = quickiesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setQuickies(quickiesList);
          });
        } else {
          console.log("No such profile!");
          setProfileData(null);
        }

        setLoading(false);
      });
    };

    fetchProfileAndQuickies();
  }, [handle, db]);

  if (loading) return <Loader />;

  // Extract firstname, lastname, and fullname from profileData
  const { firstname, lastname, fullname } = profileData || {};

  // Handle display name logic (same as in ProfileInfo.js)
  const displayName = firstname && lastname ? `${firstname} ${lastname}` : fullname || "No name provided";

  return (
    <Wrapper>
      <Header>
        <div className="profile-top">
          {profileData ? (
            <>
              {/* Display name logic added here */}
              <span className="fullname">{displayName}</span>
              <span className="quickieCount">
                {quickies.length ? `${quickies.length} Attacks` : "No Attacks"}
              </span>
            </>
          ) : (
            <span>Profile not found</span>
          )}
        </div>
      </Header>

      {profileData && <ProfileInfo profile={profileData} />}
      
      {quickies.length
        ? quickies.map((quickie) => (
            <Quickie key={quickie.id} quickie={quickie} />
          ))
        : null}
    </Wrapper>
  );
};

export default Profile;
