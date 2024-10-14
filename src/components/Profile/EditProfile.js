import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Header from "../Header";
import Loader from "../Loader";
import EditProfileForm from "./EditProfileForm";
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore
import { getAuth } from "firebase/auth"; // Firebase Authentication
import { updateAvatarEverywhere } from "../../utils"; // Import the avatar update utility

const Wrapper = styled.div`
  padding-bottom: 5rem;

  .flex-wrapper {
    display: flex;
    justify-content: center;

    form {
      .cover-photo {
        margin-bottom: 1rem;
        cursor: pointer;
      }

      .avatar-input {
        margin-top: -100px;
        margin-left: 1rem;
        cursor: pointer;
      }

      div.bio-wrapper {
        background: ${(props) => props.theme.tertiaryColor2};
        margin-bottom: 1.4rem;
        border-bottom: 1px solid ${(props) => props.theme.accentColor};
        padding: 0.5rem;

        label {
          color: ${(props) => props.theme.secondaryColor};
          margin-bottom: 0.4rem;
        }

        textarea {
          font-size: 1rem;
          width: 100%;
          background: ${(props) => props.theme.tertiaryColor2};
          border: none;
          font-family: ${(props) => props.theme.font};
          color: ${(props) => props.theme.primaryColor};
        }
      }
    }
  }

  @media screen and (max-width: 760px) {
    .flex-wrapper {
      display: block;
    }
  }
`;

const EditProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      try {
        // Fetch profile data from Firestore using the user's UID
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfileData(profileSnap.data());
        } else {
          console.error("No profile found for this user.");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, db]);

  // After profile update, call updateAvatarEverywhere to update avatar across the app
  const handleAvatarUpdate = async (newAvatarUrl) => {
    if (user && newAvatarUrl) {
      await updateAvatarEverywhere(user.uid, newAvatarUrl); // Call the update utility function
    }
  };

  if (loading) return <Loader />;

  return (
    <Wrapper>
      <Header>Edit Profile</Header>
      <div className="flex-wrapper">
        <EditProfileForm profile={profileData} onAvatarUpdate={handleAvatarUpdate} />
      </div>
    </Wrapper>
  );
};

export default EditProfile;
