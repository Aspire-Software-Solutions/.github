import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import useInput from "../../hooks/useInput";
import Button from "../../styles/Button";
import { displayError, uploadImage } from "../../utils";
import CoverPhoto from "../../styles/CoverPhoto";
import Avatar from "../../styles/Avatar";
import styled, { css } from "styled-components";
import { getFirestore, doc, updateDoc } from "firebase/firestore"; // Firestore
import Toggle from "../ui/Toggle";
import { getAuth } from "firebase/auth";

const defaultAvatarUrl = "/default-avatar.png"; // Default avatar path
const defaultCoverPhotoUrl = "/default-cover-photo.png"; // Default cover photo path

// Local styled components for EditProfileForm
const EditableCoverPhoto = styled(CoverPhoto)`
  border: 2px solid ${(props) => props.theme.accentColor};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${(props) => props.theme.primaryColor};
  }
`;

const EditableAvatar = styled(Avatar)`
  border: 3px solid ${(props) => props.theme.accentColor};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${(props) => props.theme.primaryColor};
  }
`;

const StyledForm = styled.form`
  width: 380px;
  border: 1px solid ${(props) => props.theme.tertiaryColor};
  padding: 2rem;
  border-radius: 10px;

  span {
    text-align: center;
    display: block;
    margin-bottom: 0.5rem;
    color: ${(props) => props.theme.secondaryColor};
  }

  .group-input {
    display: flex;
    justify-content: space-between;

    div:nth-child(1) {
      margin-right: 1rem;
    }
  }

  ${(props) =>
    props.lg &&
    css`
      width: 98%;
      border: none;
      border-radius: none;
    `}

  ${(props) =>
    props.center &&
    css`
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `}

  @media screen and (max-width: 400px) {
    width: 360px;
  }

  input,
  textarea {
    width: 100%;
    padding: 0.1rem;
    margin-bottom: .2rem;
    background-color: ${(props) => props.theme.tertiaryColor2}; /* Set background color for inputs */
    border: 1px solid ${(props) => props.theme.accentColor}; /* Add a border */
    border-radius: 5px;
    color: ${(props) => props.theme.primaryColor}; /* Set text color */
    font-size: 1rem;
    font-family: ${(props) => props.theme.font};

    &:focus {
      outline: none;
      border-color: ${(props) => props.theme.primaryColor}; /* Highlight border on focus */
    }
  }

  .bio-wrapper,
  .input-wrapper {
    background: ${(props) => props.theme.tertiaryColor2};
    margin-bottom: 1.4rem;
    border-bottom: 1px solid ${(props) => props.theme.accentColor};
    padding: 0.5rem;

    label {
      color: ${(props) => props.theme.secondaryColor};
      margin-bottom: 0.4rem;
      display: block;
    }

    input,
    textarea {
      width: 100%;
      background: inherit;
      border: none;
      font-size: 1rem;
      color: ${(props) => props.theme.primaryColor};
    }
  }
`;

const EditProfileForm = ({ profile, history, onAvatarUpdate }) => {
  const [avatarState, setAvatar] = useState(""); // Store the selected avatar file
  const [coverPhotoState, setCoverPhoto] = useState(""); // Store the selected cover photo file
  const [avatarFile, setAvatarFile] = useState(null); // New state to hold avatar file
  const [coverPhotoFile, setCoverPhotoFile] = useState(null); // New state to hold cover photo file
  const [loading, setLoading] = useState(false); // Define loading state
  const firstname = useInput(profile && profile.firstname);
  const lastname = useInput(profile && profile.lastname);
  const website = useInput(profile && profile.website);
  const bio = useInput(profile && profile.bio);
  const avatarUrl = useInput(profile && profile.avatarUrl);
  const coverPhoto = useInput(profile && profile.coverPhoto);
  const [privateAccount, setPrivateAccount] = useState(false);
  const auth = getAuth();
  const [showActiveStatus, setShowActiveStatus] = useState(
    profile?.showActiveStatus !== undefined ? profile.showActiveStatus : true
  );

  const user = auth.currentUser;

  const handle = profile && profile.handle; // Assuming handle is a unique identifier for the profile
  const userId = profile && profile.userId; // Using userId for Firestore

  const db = getFirestore(); // Initialize Firestore

  const handleEditProfile = async (e) => {
    e.preventDefault();

    if (!firstname.value || !lastname.value) {
      return toast.error("You cannot leave firstname/lastname empty");
    }

    setLoading(true); // Set loading to true when the form is submitted

    try {
      let newAvatarUrl = avatarUrl.value;
      let newCoverPhotoUrl = coverPhoto.value;

      // Upload avatar if a new file is selected
      if (avatarFile) {
        newAvatarUrl = await uploadImage(avatarFile);
        if (onAvatarUpdate) {
          onAvatarUpdate(newAvatarUrl); // Trigger the avatar update everywhere
        }
      }

      // Upload cover photo if a new file is selected
      if (coverPhotoFile) {
        newCoverPhotoUrl = await uploadImage(coverPhotoFile);
      }

      const profileRef = doc(db, "profiles", userId); // Reference to the profile document in Firestore

      // Update profile in Firestore
      await updateDoc(profileRef, {
        firstname: firstname.value,
        lastname: lastname.value,
        bio: bio.value,
        website: website.value,
        avatarUrl: newAvatarUrl,
        coverPhoto: newCoverPhotoUrl,
      });

      toast.success("Your profile has been updated 🥳");
    } catch (err) {
      return displayError(err);
    } finally {
      setLoading(false); // Set loading to false after the update is complete
    }

    [firstname, lastname, bio, website, avatarUrl, coverPhoto].forEach((field) =>
      field.setValue("")
    );

    history.push(`/${handle}`);
  };

  // Cancel button to reset changes and navigate back to profile
  const cancelEdit = () => {
    // Reset local state to their original values
    setAvatar(avatarUrl.value);
    setCoverPhoto(coverPhoto.value);
    setAvatarFile(null); // Reset avatar file
    setCoverPhotoFile(null); // Reset cover photo file

    // Navigate back to the profile page
    history.push(`/${handle}`);
  };

  const handleCoverPhoto = (e) => {
    const file = e.target.files[0];
    setCoverPhotoFile(file); // Store the selected file locally
    setCoverPhoto(URL.createObjectURL(file)); // Show the preview of the selected image
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file); // Store the selected file locally
    setAvatar(URL.createObjectURL(file)); // Show the preview of the selected image
  };

  const handleAccountToggle = async (newValue) => {
    if( !user ) return;

    try {
      setPrivateAccount(newValue);
      const userDocRef = doc(db, "profiles", user.uid);
      await updateDoc(userDocRef, {
        privateAccount: newValue
      });

    } catch (error) {
      console.error("Error in updating account's rprivacy: ", error);
      setPrivateAccount((prev) => !prev)
    }
  }

  const handleStatusToggle = async (newValue) => {
    if (!user) return;

    try {
      setShowActiveStatus(newValue);
      const userDocRef = doc(db, "profiles", user.uid);
      await updateDoc(userDocRef, {
        showActiveStatus: newValue
      });
    } catch (error) {
      console.error("Error updating active status preference: ", error);
      setShowActiveStatus((prev) => !prev);
    }
  };

  return (
    <StyledForm lg onSubmit={handleEditProfile}>
      <div className="cover-photo">
        <label htmlFor="cover-photo-input">
          <EditableCoverPhoto
            src={coverPhotoState || coverPhoto.value || defaultCoverPhotoUrl}
            alt="cover"
          />
        </label>
        <input
          type="file"
          id="cover-photo-input"
          accept="image/*"
          onChange={handleCoverPhoto}
        />
      </div>

      <div className="avatar-input">
        <label htmlFor="avatar-input-file">
          <EditableAvatar
            lg
            src={avatarState || avatarUrl.value || defaultAvatarUrl}
            alt="avatar"
            showStatus={showActiveStatus}
          />
        </label>
        <input
          type="file"
          accept="image/*"
          id="avatar-input-file"
          onChange={handleAvatar}
        />
      </div>

      <div className="input-wrapper">
        <label>First Name</label>
        <input
          placeholder="First Name"
          value={firstname.value}
          onChange={firstname.onChange}
        />
      </div>

      <div className="input-wrapper">
        <label>Last Name</label>
        <input
          placeholder="Last Name"
          value={lastname.value}
          onChange={lastname.onChange}
        />
      </div>

      <div className="bio-wrapper">
        <label className="bio" htmlFor="bio">
          Bio
        </label>
        <TextareaAutosize
          id="bio"
          placeholder="Bio"
          value={bio.value}
          onChange={bio.onChange}
        />
      </div>

      <div className="input-wrapper">
        <label>Website</label>
        <input
          placeholder="Website"
          value={website.value}
          onChange={website.onChange}
        />
      </div>
      <Toggle 
        initialValue={privateAccount}
        onToggle={handleAccountToggle}  
        labelProps={{
          height: '24px',
          cursor: 'pointer',
        }}
        sliderProps={{
          thumbTranslate: '30px',
        }}
        text="Set private account"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button outline disabled={loading} type="submit">
          {loading ? "Saving" : "Save"}
        </Button>
        <Button outline type="button" onClick={cancelEdit}>
          Cancel
        </Button>
      </div>
    </StyledForm>
  );
};

export default withRouter(EditProfileForm);

