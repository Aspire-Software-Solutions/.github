import React from "react";
import { Link, useHistory } from "react-router-dom";
import styled from "styled-components";
import CoverPhoto from "../../styles/CoverPhoto";
import Avatar from "../../styles/Avatar";
import Button from "../../styles/Button";
import Follow from "./Follow";
import { LinkIcon } from "../Icons"; // Removed LocationIcon and DobIcon since we don't use location/dob anymore
import CustomResponse from "../CustomResponse";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc, doc } from "firebase/firestore"; // Firestore imports

const defaultAvatarUrl = "/default-avatar.png";
const defaultCoverPhotoUrl = "/default-cover-photo.png";

const Wrapper = styled.div`
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  padding-bottom: 1rem;

  .avatar {
    margin-left: 1.4rem;
    margin-top: -4rem;
  }

  .profile-name-handle {
    display: flex;
    flex-direction: column;
    margin-left: 1.4rem;
    position: relative;
    top: -16px;

    span.fullname {
      font-weight: bold;
    }

    span.handle {
      margin-top: 0.1rem;
      color: ${(props) => props.theme.secondaryColor};
    }
  }

  .profile-info {
    padding-left: 1.4rem;

    .bio {
      width: 90%;
    }
  }

  div.loc-web {
    display: flex;
    color: ${(props) => props.theme.secondaryColor};
    margin: 0.6rem 0;

    span {
      margin-right: 1.5rem;
    }

    svg {
      margin-right: 0.2rem;
      position: relative;
      top: 3px;
    }

    &:hover {
      color: ${(props) => props.theme.accentColor}; /* Change color on hover */
    }
  }

  div.follow-following {
    color: ${(props) => props.theme.secondaryColor};
    span {
      margin-right: 1.3rem;
    }

    .followers-link, .following-link {
      cursor: pointer;
      text-decoration: none;
      color: ${(props) => props.theme.secondaryColor}; /* Style the link */

      &:hover {
        color: ${(props) => props.theme.accentColor}; /* Change color on hover */
      }
    }
  }

  @media screen and (max-width: 530px) {
    div.loc-web {
      display: flex;
      flex-direction: column;

      span {
        margin-bottom: 0.7rem;
      }
    }
  }
`;

const ProfileInfo = ({ profile }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const history = useHistory(); // Moved useHistory inside the component
  const db = getFirestore(); // Firestore instance

  // Determine if the logged-in user is viewing their own profile
  const isSelf = currentUser && profile && currentUser.uid === profile.userId;

  if (!profile) {
    return (
      <CustomResponse text="Oops, you are trying to visit a profile which seems to not exist. Make sure the profile handle exists" />
    );
  }

  const {
    coverPhoto,
    avatarUrl,
    bio,
    website,
    isFollowing,
    followersCount,
    followingCount,
    handle,
    firstname,
    lastname,
    fullname, // Added fullname field
  } = profile;

  // Handle the display name logic
  const displayName = firstname && lastname ? `${firstname} ${lastname}` : fullname || "No name provided";

  const handleStartConversation = async (userId, userHandle) => {
    if (!currentUser) return;

    try {
      // Check if a conversation between the two users already exists
      const conversationsRef = collection(db, "conversations");
      const q = query(conversationsRef, where("members", "array-contains", currentUser.uid));
      const querySnapshot = await getDocs(q);

      let conversationId = null;

      querySnapshot.forEach((doc) => {
        const conversation = doc.data();
        if (conversation.members.includes(userId)) {
          conversationId = doc.id;
        }
      });

      // If no conversation exists, create one
      if (!conversationId) {
        const newConversation = await addDoc(collection(db, "conversations"), {
          members: [currentUser.uid, userId],
          isGroup: false,
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          readBy: [currentUser.uid]
        });

        conversationId = newConversation.id;
      }

      // Redirect to the conversation page
      history.push(`/conversations/${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  return (
    <Wrapper>
      <CoverPhoto src={coverPhoto || defaultCoverPhotoUrl} alt="cover" />
      <Avatar className="avatar" lg src={avatarUrl || defaultAvatarUrl} alt="profile" />

      {isSelf ? (
        <Link to="/settings/profile">
          <Button relative outline className="action-btn">
            Edit Profile
          </Button>
        </Link>
      ) : (
        <>
          <Follow
            relative
            className="action-btn"
            isFollowing={isFollowing}
            userId={profile.userId}
          />
          <Button
            relative
            outline
            className="action-btn"
            onClick={() => handleStartConversation(profile.userId, profile.handle)}
          >
            Message
          </Button>
        </>
      )}

      <div className="profile-name-handle">
        <span className="fullname">{displayName}</span> {/* Updated to use displayName */}
        <span className="handle">{`@${handle}`}</span>
      </div>

      <div className="profile-info">
        <p className="bio">{bio}</p>

        {!website ? null : (
          <div className="loc-web">
            {website ? (
              <span>
                <LinkIcon />{" "}
                <a href={website} target="_blank" rel="noopener noreferrer">
                  {website}
                </a>
              </span>
            ) : null}
          </div>
        )}

        <div className="follow-following">
          <span>
            <Link to={`/${handle}/followers`} className="followers-link">
              {followersCount ? `${followersCount} followers` : "No followers"}
            </Link>
          </span>
          <span>
            <Link to={`/${handle}/following`} className="following-link">
              {followingCount ? `${followingCount} following` : "Not following anyone"}
            </Link>
          </span>
        </div>
      </div>
    </Wrapper>
  );
};

export default ProfileInfo;
