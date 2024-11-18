import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import moment from "moment";
import Avatar from "../../styles/Avatar";
import DeleteComment from "./DeleteComment";
import { Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";
import { usePresence } from "../Auth/Presence";
import { useStatus } from "../Auth/StatusProvider";

const defaultAvatarUrl = "/default-avatar.png";

const Wrapper = styled.div`
  display: flex;
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  padding: 1.5rem 1rem 1rem 1rem;

  .comment-info-user {
    display: flex;
    align-items: center;

    svg {
      margin-left: 0.6rem;
      position: relative;
      top: 3px;
    }
  }

  .comment-info-user span.username {
    font-weight: 500;
  }

  .comment-info-user span.secondary {
    padding-left: 0.5rem;
    color: ${(props) => props.theme.secondaryColor};
  }

  @media screen and (max-width: 430px) {
    flex-direction: column;

    .comment-info-user {
      font-size: 0.83rem;
    }

    .avatar {
      display: none;
    }

    .username {
      display: none;
    }

    .comment-info-user span.secondary {
      padding-left: 0;

      :first-child {
        padding-right: 0.6rem;
      }
    }
  }
`;

const PRESENCE_TIMEOUT = 2 * 60 * 1000;

const Comment = ({ comment }) => {
  const { text, userId, userName, userAvatar, createdAt, handle } = comment;
  const [userStatus, setUserStatus] = useState({ isActive: false });
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const rtdb = getDatabase();
  const { showActiveStatus } = useStatus();

  // Function to check if a user should be considered online
  const isUserActive = (lastChanged) => {
    if (!lastChanged) return false;
    const lastChangedTime = new Date(lastChanged).getTime();
    return Date.now() - lastChangedTime < PRESENCE_TIMEOUT;
  };

  // Effect for subscribing to user's status
  useEffect(() => {
    if (!userId) return;

    const statusRef = ref(rtdb, `/status/${userId}`);
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
  }, [userId, rtdb]);

  const commentDate = createdAt instanceof Timestamp ? createdAt.toDate() : createdAt;

  return (
    <Wrapper>
      <Link to={`/${handle}`}>
        <Avatar 
          className="avatar" 
          src={userAvatar || defaultAvatarUrl} 
          alt="avatar"
          showStatus
          isActive={showActiveStatus}
        />
      </Link>
      <div className="comment-info">
        <div className="comment-info-user">
          <Link to={`/${handle}`}>
            <span className="username">{userName}</span>
          </Link>
          <Link to={`/${handle}`}>
            <span className="secondary">{`@${handle}`}</span>
            <span className="secondary">{moment(commentDate).fromNow()}</span>
          </Link>

          {currentUser && currentUser.uid === userId && (
            <DeleteComment id={comment.id} commentData={comment} />
          )}
        </div>

        <p>{text}</p>
      </div>
    </Wrapper>
  );
};

export default Comment;