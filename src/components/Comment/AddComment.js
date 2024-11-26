import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import TextareaAutosize from "react-textarea-autosize";
import useInput from "../../hooks/useInput";
import Button from "../../styles/Button";
import { displayError } from "../../utils";
import Avatar from "../../styles/Avatar";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  collection,
  addDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";

const defaultAvatarUrl = "/default-avatar.png";

const Wrapper = styled.div`
  display: flex;
  padding: 1rem 0;
  align-items: flex-start;

  textarea {
    width: 100%;
    background: inherit;
    border: none;
    font-size: 1.23rem;
    font-family: ${(props) => props.theme.font};
    color: ${(props) => props.theme.primaryColor};
    margin-bottom: 1.4rem;
    padding: 0.5rem;
  }

  .add-comment-action {
    margin-left: auto;
  }

  button {
    position: relative;
    margin-top: 1rem;
  }

  .avatar {
    margin-right: 1rem;
  }

  @media screen and (max-width: 470px) {
    textarea {
      width: 90%;
    }
  }
`;

const PRESENCE_TIMEOUT = 2 * 60 * 1000;

const AddComment = ({ id }) => {
  const comment = useInput("");
  const [userAvatar, setUserAvatar] = useState(defaultAvatarUrl);
  const [showStatus, setShowStatus] = useState(true);
  const [userStatus, setUserStatus] = useState({ isActive: false });
  const db = getFirestore();
  const auth = getAuth();
  const rtdb = getDatabase();

  const isUserActive = (lastChanged, showActiveStatus) => {
    if (!lastChanged || !showActiveStatus) return false;
    const lastChangedTime = new Date(lastChanged).getTime();
    return Date.now() - lastChangedTime < PRESENCE_TIMEOUT;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "profiles", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserAvatar(userData.avatarUrl || defaultAvatarUrl);
          setShowStatus(userData.showActiveStatus !== undefined ? userData.showActiveStatus : true);
        }
      }
    };
    fetchUserProfile();
  }, [auth, db]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const statusRef = ref(rtdb, `/status/${user.uid}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserStatus({
          isActive: data.state === "online" && isUserActive(data.last_changed, showStatus),
          lastChanged: data.last_changed,
        });
      } else {
        setUserStatus({ isActive: false });
      }
    });

    return () => unsubscribe();
  }, [auth, rtdb, showStatus]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!comment.value) return toast.error("Reply something");

    try {
      const user = auth.currentUser;
      if (!user) {
        return toast.error("You need to be logged in to reply.");
      }

      const userRef = doc(db, "profiles", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return toast.error("User profile not found.");
      }
      const { handle } = userSnap.data();

      const quickieRef = doc(db, "quickies", id);
      const quickieSnap = await getDoc(quickieRef);
      if (!quickieSnap.exists()) {
        return toast.error("Quickie not found.");
      }

      const postOwnerId = quickieSnap.data().userId;

      await updateDoc(quickieRef, {
        comments: arrayUnion({
          text: comment.value,
          userId: user.uid,
          userName: user.displayName,
          userAvatar,
          handle,
          createdAt: new Date(),
        }),
        commentsCount: increment(1),
      });

      if (user.uid !== postOwnerId) {
        const notificationsRef = collection(db, "notifications");
        await addDoc(notificationsRef, {
          type: "comment",
          quickieId: id,
          fromUserId: user.uid,
          userId: postOwnerId,
          createdAt: new Date(),
          isRead: false,
        });
      }

      toast.success("Your reply has been added");
    } catch (err) {
      console.error("Error adding comment: ", err);
      return displayError(err);
    }

    comment.setValue("");
  };

  const user = auth.currentUser;

  if (!user) {
    return <p></p>;
  }

  return (
    <Wrapper>
      <Avatar
        src={userAvatar}
        alt="avatar"
        showStatus={showStatus}
        isActive={userStatus.isActive}
      />

      <form onSubmit={handleAddComment}>
        <div className="add-comment">
          <TextareaAutosize
            cols="48"
            placeholder="Reply with an attack!"
            type="text"
            value={comment.value}
            onChange={comment.onChange}
          />

          <div className="add-comment-action">
            <Button sm type="submit">
              Reply
            </Button>
          </div>
        </div>
      </form>
    </Wrapper>
  );
};

export default AddComment;
