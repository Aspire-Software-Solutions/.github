import React, { useEffect, useState } from "react";
import Avatar from "../../styles/Avatar";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import { usePresence } from "../Auth/Presence";
import { useStatus } from "../Auth/StatusProvider";

const PRESENCE_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

const Message = ({ message, currentUserId }) => {
  const { senderId, messageText, messageImageUrl, timestamp } = message;
  const [senderProfile, setSenderProfile] = useState(null);
  const [userStatus, setUserStatus] = useState({ isActive: false });
  const db = getFirestore();
  const rtdb = getDatabase();
  const { showActiveStatus } = useStatus();

  // Function to check if a user should be considered online
  const isUserActive = (lastChanged) => {
    if (!lastChanged) return false;
    const lastChangedTime = new Date(lastChanged).getTime();
    return Date.now() - lastChangedTime < PRESENCE_TIMEOUT;
  };

  // Fetch sender profile
  useEffect(() => {
    const fetchSenderProfile = async () => {
      const senderRef = doc(db, "profiles", senderId);
      const senderSnap = await getDoc(senderRef);
      if (senderSnap.exists()) {
        setSenderProfile(senderSnap.data());
      }
    };
    fetchSenderProfile();
  }, [senderId, db]);

  // Set up real-time status listener
  useEffect(() => {
    if (!senderId) return;

    const statusRef = ref(rtdb, `/status/${senderId}`);
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
  }, [senderId, rtdb]);

  // Determine if the message is sent by the current user
  const isCurrentUser = senderId === currentUserId;

  return (
    <div
      className={`d-flex mb-3 ${
        isCurrentUser ? "justify-content-end" : "justify-content-start"
      }`}
    >
      {!isCurrentUser && senderProfile && (
        <Link to={`/${senderProfile.handle}`}>
          <Avatar
            src={senderProfile.avatarUrl || "/default-avatar.png"}
            alt={senderProfile.handle || "User"}
            style={{
              width: "40px",
              height: "40px",
              marginRight: "10px",
              cursor: "pointer",
            }}
            showStatus
            isActive={userStatus.isActive}
          />
        </Link>
      )}

      <div
        className={`p-2 rounded ${
          isCurrentUser ? "bg-primary text-white" : "bg-light text-dark"
        }`}
        style={{ maxWidth: "70%" }}
      >
        {!isCurrentUser && senderProfile && (
          <Link to={`/${senderProfile.handle}`}>
            <strong style={{ cursor: "pointer" }}>
              {senderProfile.handle || "User"}
            </strong>
          </Link>
        )}
        {messageText && <p className="mb-1">{messageText}</p>}

        {messageImageUrl && (
          <>
            {messageImageUrl.includes(".mp4") ||
            messageImageUrl.includes(".mov") ? (
              <video controls src={messageImageUrl} style={{ width: "100%" }} />
            ) : (
              <img
                src={messageImageUrl}
                alt="Media preview"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                }}
              />
            )}
          </>
        )}

        <small className="text-muted">
          {timestamp
            ? new Date(timestamp.toDate()).toLocaleString()
            : "Sending..."}
        </small>
      </div>

      {isCurrentUser && senderProfile && (
        <Link to={`/${senderProfile.handle}`}>
          <Avatar
            src={senderProfile.avatarUrl || "/default-avatar.png"}
            alt="You"
            style={{
              width: "40px",
              height: "40px",
              marginLeft: "10px",
              cursor: "pointer",
            }}
            showStatus
            isActive={showActiveStatus}
          />
        </Link>
      )}
    </div>
  );
};

export default Message;