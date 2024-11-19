import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";
import ProfileInfo from "./ProfileInfo";
import Quickie from "../Quickie/Quickie";
import Loader from "../Loader";
import { getFirestore, collection, query, where, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { usePresence } from "../Auth/Presence";

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

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${(props) => {
    if (props.error) return "#ff4444";
    return props.isActive ? "#2ecc71" : "#95a5a6"; 
  }};
  transition: background-color 0.3s ease;
`;

const PRESENCE_TIMEOUT = 2 * 60 * 1000;

const Profile = () => {
  const { handle } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [quickies, setQuickies] = useState([]);
  const [followingStatuses, setFollowingStatuses] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [currentProfileStatus, setCurrentProfileStatus] = useState({ isActive: false });
  const [loading, setLoading] = useState(true);
  
  // Initialize Firebase services
  const db = getFirestore();
  const auth = getAuth();
  const rtdb = getDatabase();
  const user = auth.currentUser;

  // Function to fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const userProfileQuery = query(
        collection(db, "profiles"),
        where("userId", "==", userId)
      );
      
      const snapshot = await new Promise((resolve) => {
        const unsubscribe = onSnapshot(userProfileQuery, (querySnapshot) => {
          unsubscribe();
          resolve(querySnapshot);
        });
      });

      if (!snapshot.empty) {
        const profileData = snapshot.docs[0].data();
        return {
          fullname: profileData.firstname && profileData.lastname 
            ? `${profileData.firstname} ${profileData.lastname}`
            : profileData.fullname || "Unknown User",
          ...profileData
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Function to check if a user should be considered online
  const isUserActive = (lastChanged) => {
    if (!lastChanged) return false;
    const lastChangedTime = new Date(lastChanged).getTime();
    return Date.now() - lastChangedTime < PRESENCE_TIMEOUT;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileQuery = query(
          collection(db, "profiles"),
          where("handle", "==", handle)
        );

        const snapshot = await new Promise((resolve) => {
          const unsubscribe = onSnapshot(profileQuery, (querySnapshot) => {
            unsubscribe();
            resolve(querySnapshot);
          });
        });

        if (!snapshot.empty) {
          const profile = {
            id: snapshot.docs[0].id,
            ...snapshot.docs[0].data(),
          };
          setProfileData(profile);

          // Skip privacy check if the current user is viewing their own profile
          if (profile.userId === user.uid) {
            setIsPrivate(false);
            setIsFollowing(true);
            return;
          }

          // Check if the account is private
          if (profile.privateAccount) {
            setIsPrivate(true);

            // Check if the current user is following this profile
            const userDoc = await getDoc(doc(db, "profiles", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setIsFollowing(userData.following?.includes(profile.userId));
            }
          }

          const profileStatusRef = ref(rtdb, `/status/${profile.userId}`);
            const unsubscribeStatus = onValue(profileStatusRef, (snapshot) => {
              const data = snapshot.val();
              if (data) {
                setCurrentProfileStatus({
                  isActive: data.state === 'online' && isUserActive(data.last_changed),
                  lastChanged: data.last_changed
                });
              }
            });


          const quickiesQuery = query(
            collection(db, "quickies"),
            where("userId", "==", profile.userId),
            orderBy("createdAt", "desc")
          );

          const unsubscribeQuickies = onSnapshot(quickiesQuery, (quickiesSnapshot) => {
              const quickiesList = quickiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));
              setQuickies(quickiesList);
            });

            setLoading(false);
            return () => {
        unsubscribeQuickies();
        unsubscribeStatus();
      };
        } else {
          setProfileData(null);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [handle, db, user]);

  // Handle following statuses
  useEffect(() => {
    if (!profileData?.following?.length) return;

    const unsubscribers = profileData.following.map(userId => {
      const statusRef = ref(rtdb, `/status/${userId}`);
      
      // First, fetch the user's profile
      return fetchUserProfile(userId).then(userProfile => {
        const onStatusChange = onValue(statusRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setFollowingStatuses(current => ({
              ...current,
              [userId]: {
                id: userId,
                isActive: data.state === 'online' && isUserActive(data.last_changed),
                name: userProfile ? userProfile.fullname : "Unknown User",
                firstname: userProfile?.firstname || "",
                lastname: userProfile?.lastname || "",
                lastChanged: data.last_changed
              }
            }));
          }
        });

        return onStatusChange;
      });
    });

    return () => {
      unsubscribers.forEach(unsubscriberPromise => {
        unsubscriberPromise.then(unsubscribe => unsubscribe?.());
      });
    };
  }, [profileData?.following, rtdb]);

  if (loading) return <Loader />;

  if (isPrivate && !isFollowing) {
    return (
      <Wrapper>
          {profileData && <ProfileInfo profile={profileData} />}
          <br/>
          <h4>This account is private.</h4>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <div className="profile-top">
          {profileData ? (
            <>
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
      {quickies.length > 0 && quickies.map((quickie) => (
        <Quickie key={quickie.id} quickie={quickie} />
      ))}
    </Wrapper>
  );
};

export default Profile;