import React, { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import styled from "styled-components";
import CoverPhoto from "../../styles/CoverPhoto";
import Avatar from "../../styles/Avatar";
import Button from "../../styles/Button";
import Follow from "./Follow";
import { LinkIcon } from "../Icons";
import CustomResponse from "../CustomResponse";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import { usePresence } from "../Auth/Present";

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
      color: ${(props) => props.theme.accentColor};
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
      color: ${(props) => props.theme.secondaryColor};

      &:hover {
        color: ${(props) => props.theme.accentColor};
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

const PRESENCE_TIMEOUT = 2 * 60 * 1000;

const ProfileInfo = ({ profile }) => {
  const [userStatus, setUserStatus] = useState({ isActive: false });
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const history = useHistory();
  const db = getFirestore();
  const rtdb = getDatabase();

  const isUserActive = (lastChanged) => {
    if (!lastChanged) return false;
    const lastChangedTime = new Date(lastChanged).getTime();
    return Date.now() - lastChangedTime < PRESENCE_TIMEOUT;
  };

  // Set up real-time status listener for profile user
  useEffect(() => {
    if (!profile?.userId) return;

    const statusRef = ref(rtdb, `/status/${profile.userId}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserStatus({
          isActive: data.state === 'online' && isUserActive(data.last_changed),
          lastChanged: data.last_changed
        });
      } else {
        setUserStatus({ isActive: false });
      }
    });

    return () => unsubscribe();
  }, [profile?.userId, rtdb]);

  if (!profile) {
    return (
      <CustomResponse text="Oops, you are trying to visit a profile which seems to not exist. Make sure the profile handle exists" />
    );
  }

  const isSelf = currentUser && profile && currentUser.uid === profile.userId;

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
    fullname,
  } = profile;

  const displayName = firstname && lastname ? `${firstname} ${lastname}` : fullname || "No name provided";

  const handleStartConversation = async (userId, userHandle) => {
    if (!currentUser) return;

    try {
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

      history.push(`/conversations/${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  return (
    <Wrapper>
      <CoverPhoto src={coverPhoto || defaultCoverPhotoUrl} alt="cover" />
      <Avatar 
        className="avatar" 
        lg 
        src={avatarUrl || defaultAvatarUrl} 
        alt="profile"
        showStatus
        isActive={userStatus.isActive}
      />

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
        <span className="fullname">{displayName}</span>
        <span className="handle">{`@${handle}`}</span>
      </div>

      <div className="profile-info">
        <p className="bio">{bio}</p>

        {!website ? null : (
          <div className="loc-web">
            {website && (
              <span>
                <LinkIcon />{" "}
                <a href={website} target="_blank" rel="noopener noreferrer">
                  {website}
                </a>
              </span>
            )}
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