import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { getFirestore, collection, query, where, orderBy, getDocs, 
         doc, deleteDoc, getDoc, updateDoc, addDoc, arrayUnion, increment, writeBatch } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";
import { TrashIcon } from "./Icons";
import Button from "../styles/Button";

// Animation for fading out the notification
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const Wrapper = styled.div`
  padding: 1rem;
`;

const NotificationItem = styled.div`
  padding: 0.75rem 1rem;
  background-color: ${(props) => (props.isRead ? props.theme.overlay : props.theme.background)};
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  cursor: pointer;
  position: relative; /* For positioning the dismiss button */

  &:hover {
    background-color: ${(props) => props.theme.tertiaryColor2};
  }

  p {
    margin: 0;
    font-size: 1rem;
  }

  span {
    color: ${(props) => props.theme.secondaryColor};
    font-size: 0.85rem;
  }

  // Apply fade-out animation if the item is dismissed
  &.fade-out {
    animation: ${fadeOut} 0.5s forwards;
  }
`;

const DismissButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: green;
  cursor: pointer;
`;

export const handleApproveFollowRequest = async (requestId, fromUserId, toUserId) => {
  const db = getFirestore();
  const auth = getAuth();

  // Log the current user ID and the target user ID
  console.log("Approving follow request:");
  console.log("Current User ID:", auth.currentUser?.uid);
  console.log("Target User ID:", toUserId);
  console.log("Request ID:", requestId);
  console.log("From User ID:", fromUserId);

  // Ensure the current user matches the target user ID
  if (auth.currentUser?.uid !== toUserId) {
    console.error("Unauthorized action: User does not match target user ID");
    throw new Error("Unauthorized action");
  }

  try {
    const batch = writeBatch(db);

    // Log Firestore document paths
    const requestRef = doc(db, "followRequests", requestId);
    const followerRef = doc(db, "profiles", fromUserId);
    const targetRef = doc(db, "profiles", toUserId);
    console.log("Firestore Document Paths:");
    console.log("Request Ref:", requestRef.path);
    console.log("Follower Ref:", followerRef.path);
    console.log("Target Ref:", targetRef.path);

    // Fetch and log the follow request document
    const requestDoc = await getDoc(requestRef);
    console.log("Request Doc Exists:", requestDoc.exists());
    if (requestDoc.exists()) {
      console.log("Request Doc Data:", requestDoc.data());
    }

    if (!requestDoc.exists() || 
        requestDoc.data().fromUserId !== fromUserId || 
        requestDoc.data().toUserId !== toUserId) {
      console.error("Invalid follow request: Data mismatch");
      throw new Error("Invalid follow request");
    }

    // Log the batch operations
    console.log("Updating follower profile...");
    batch.update(followerRef, {
      following: arrayUnion(toUserId),
      followingCount: increment(1),
    });

    console.log("Updating target profile...");
    batch.update(targetRef, {
      followers: arrayUnion(fromUserId),
      followersCount: increment(1),
    });

    console.log("Deleting follow request...");
    batch.delete(requestRef);

    // Commit the batch
    await batch.commit();
    console.log("Batch commit successful");

    // Create the notification
    await addDoc(collection(db, "notifications"), {
      type: "follow_request_approved",
      fromUserId: toUserId,
      userId: fromUserId,
      createdAt: new Date(),
      isRead: false,
      message: "approved your follow request!",
    });
    console.log("Notification created successfully");

    return true;
  } catch (error) {
    console.error("Error approving follow request:", error);
    throw error;
  }
};



export const handleRejectFollowRequest = async (requestId, fromUserId, toUserId) => {
  const db = getFirestore();
  const auth = getAuth();

  if (auth.currentUser?.uid !== toUserId) {
    throw new Error("Unauthorized action");
  }

  try {
    const requestRef = doc(db, "followRequests", requestId);

    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists() ||
        requestDoc.data().fromUserId !== fromUserId ||
        requestDoc.data().toUserId !== toUserId) {
      throw new Error("Invalid follow request");
    }

    await deleteDoc(requestRef);

    await addDoc(collection(db, "notifications"), {
      type: "follow_request_rejected",
      fromUserId: toUserId,
      userId: fromUserId,
      createdAt: new Date(),
      isRead: false,
      message: "declined your follow request.",
    });

    return true;
  } catch (error) {
    console.error("Error rejecting follow request:", error);
    throw error;
  }
};


const Notifications = ({ updateUnreadCount = () => {} }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadingOutNotifications, setFadingOutNotifications] = useState({});
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    let isMounted = true;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user || !isMounted) return;

      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const notificationSnapshot = await getDocs(q);
        
        if (!isMounted) return;

        const notificationsList = await Promise.all(
          notificationSnapshot.docs.map(async (notificationDoc) => {
            const notificationData = notificationDoc.data();
            const profileRef = doc(db, "profiles", notificationData.fromUserId);
            const profileSnap = await getDoc(profileRef);

            let fromUserHandle = notificationData.fromUserId;
            if (profileSnap.exists()) {
              fromUserHandle = profileSnap.data().handle || notificationData.fromUserId;
            }

            return {
              id: notificationDoc.id,
              ...notificationData,
              fromUserHandle,
            };
          })
        );

        if (isMounted) {
          setNotifications(notificationsList);
          const unreadCount = notificationsList.filter(n => !n.isRead).length;
          updateUnreadCount(unreadCount);
          setLoading(false);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (isMounted) {
          setError("Failed to load notifications");
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, [db, auth, updateUnreadCount]);

  const handleError = async (action, error) => {
    console.error(`Error ${action}:`, error);
    setError(`Failed to ${action.toLowerCase()}. Please try again.`);
    setTimeout(() => setError(null), 3000);
  };

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { isRead: true });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      const unreadCount = notifications.filter(n => !n.isRead).length - 1;
      updateUnreadCount(Math.max(0, unreadCount));
    } catch (error) {
      handleError("marking as read", error);
    }
  };

  const dismissNotification = async (notificationId) => {
    setFadingOutNotifications((prev) => ({ ...prev, [notificationId]: true }));

    setTimeout(async () => {
      try {
        const notificationRef = doc(db, "notifications", notificationId);
        await deleteDoc(notificationRef);

        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );
      } catch (error) {
        handleError("dismissing notification", error);
      }
    }, 500);
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Wrapper>
      {notifications.length ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={fadingOutNotifications[notification.id] ? "fade-out" : ""}
          >
            {/* Special handling for follow requests that need approval */}
            {notification.type === "follow_request" ? (
              <NotificationItem isRead={notification.isRead}>
                <p>{notification.fromUserHandle} wants to follow you</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button
                    sm
                    onClick={() => handleApproveFollowRequest(
                      notification.requestId,
                      notification.fromUserId,
                      notification.userId
                    )}
                  >
                    Approve
                  </Button>
                  <Button
                    sm
                    outline
                    onClick={() => handleRejectFollowRequest(
                      notification.requestId,
                      notification.fromUserId,
                      notification.userId
                    )}
                  >
                    Decline
                  </Button>
                </div>
                <DismissButton onClick={() => dismissNotification(notification.id)}>
                  <TrashIcon />
                </DismissButton>
              </NotificationItem>
            ) : (
              <Link
                to={
                  notification.type === "like" || notification.type === "comment"
                    ? `/${notification.fromUserHandle}/status/${notification.quickieId}`
                    : `/${notification.fromUserHandle}`
                }
                onClick={() => markAsRead(notification.id)}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <NotificationItem isRead={notification.isRead}>
                  {notification.type === "like" && <p>Hey! {notification.fromUserHandle} liked your attack.</p>}
                  {notification.type === "follow" && <p>Good news! {notification.fromUserHandle} just followed you!</p>}
                  {notification.type === "comment" && <p>{notification.fromUserHandle} commented on your attack.</p>}
                  {notification.type === "follow_request_approved" && (
                    <p>{notification.fromUserHandle} approved your follow request!</p>
                  )}
                  {notification.type === "follow_request_rejected" && (
                    <p>{notification.fromUserHandle} declined your follow request.</p>
                  )}
                  {notification.type === "moderation" && (
                    <p style={{ color: 'red', fontWeight: 'bold' }}>{notification.message}</p>
                  )}
                  {notification.type === "report_update" && (
                    <p style={{ color: 'orange' }}>{notification.message}</p>
                  )}
                  {notification.type === "content_removed" && (
                    <p style={{ color: 'darkred', fontWeight: 'bold' }}>{notification.message}</p>
                  )}
                  {notification.type === "account_suspended" && (
                    <p style={{ color: 'purple', fontWeight: 'bold' }}>{notification.message}</p>
                  )}
                  {notification.type === "warning" && (
                    <p style={{ color: 'darkorange' }}>{notification.message}</p>
                  )}
                  <DismissButton onClick={(e) => {
                    e.preventDefault();
                    dismissNotification(notification.id);
                  }}>
                    <TrashIcon />
                  </DismissButton>
                </NotificationItem>
              </Link>
            )}
          </div>
        ))
      ) : (
        <p>No notifications yet.</p>
      )}
    </Wrapper>
  );
};

export default Notifications;