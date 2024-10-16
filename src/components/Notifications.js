import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth"; // Firebase Auth
import { Link } from "react-router-dom";

const Wrapper = styled.div`
  padding: 1rem;
`;

const NotificationItem = styled.div`
  padding: 0.75rem 1rem;
  background-color: ${(props) => (props.isRead ? "#f0f0f0" : "#fff")};
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  cursor: pointer;

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
`;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchNotificationsWithHandles = async () => {
      if (!currentUser) return;

      setLoading(true);

      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const notificationSnapshot = await getDocs(q);
        const notificationsList = await Promise.all(
          notificationSnapshot.docs.map(async (doc) => {
            const notificationData = doc.data();
            const fromUserRef = doc(db, "profiles", notificationData.fromUserId);
            const fromUserSnap = await getDoc(fromUserRef);

            if (fromUserSnap.exists()) {
              const fromUserHandle = fromUserSnap.data().handle; // Assume the profile has a 'handle' field
              return {
                id: doc.id,
                ...notificationData,
                fromUserHandle: fromUserHandle || notificationData.fromUserId, // Fallback to UID if no handle
              };
            } else {
              return {
                id: doc.id,
                ...notificationData,
                fromUserHandle: notificationData.fromUserId, // Fallback to UID if no profile found
              };
            }
          })
        );

        setNotifications(notificationsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications: ", error);
        setLoading(false);
      }
    };

    fetchNotificationsWithHandles();
  }, [db, currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <Wrapper>
      {notifications.length ? (
        notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            isRead={notification.isRead}
            onClick={() => markAsRead(notification.id)}
          >
            {notification.type === "like" && (
              <p>
                <Link to={`/quickie/${notification.quickieId}`}>
                  Hey! {notification.fromUserHandle} liked your quickie.
                </Link>
              </p>
            )}
            {notification.type === "follow" && (
              <p>
                <Link to={`/${notification.fromUserHandle}`}>
                  {notification.fromUserHandle} followed you.
                </Link>
              </p>
            )}
            {notification.type === "comment" && (
              <p>
                <Link to={`/quickie/${notification.quickieId}`}>
                  {notification.fromUserHandle} commented on your quickie.
                </Link>
              </p>
            )}
            <span>{new Date(notification.createdAt.seconds * 1000).toLocaleString()}</span>
          </NotificationItem>
        ))
      ) : (
        <p>No notifications yet.</p>
      )}
    </Wrapper>
  );
};

export default Notifications;
