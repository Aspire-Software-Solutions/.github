import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayRemove,
  addDoc,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import Button from "../../styles/Button";
import Loader from "../Loader";
import { useHistory } from "react-router-dom";
import { TrashIcon, PlusIcon } from "../Icons";
import Avatar from "../../styles/Avatar";
import Modal from "react-modal";
import styled from "styled-components";
import { withTheme } from 'styled-components';

const Wrapper = styled.div`
  .conversation-item {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: space-between; /* Space between to push trash icon to the right */
    padding: 10px 0;
    border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
    cursor: pointer; /* Indicate that the item is clickable */
    transition: background-color 0.2s;

    &:hover {
      background-color: ${(props) => props.theme.bgHover};
    }

    .unread-indicator {
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: ${(props) => props.theme.accentColor};
      border-radius: 50%;
      margin-left: 400px;
    }  

    .conversation-details {
      display: flex;
      flex: 1;
      align-items: center;

      .avatars {
        display: flex;
        align-items: center;

        .avatar {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }
      }

      .info {
        display: flex;
        flex-direction: column;

        .names {
          font-weight: bold;
          color: ${(props) => props.theme.primaryTextColor};
        }

        .last-message {
          color: ${(props) => props.theme.secondaryTextColor};
          font-size: 14px;
        }
      }
    }

    .trash-icon {
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: red; /* Change color on hover */
      }
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      color: ${(props) => props.theme.primaryTextColor};
    }

    .plus-icon {
      cursor: pointer;
      width: 32px;
      height: 32px;
      transition: transform 0.2s;
      color: ${(props) => props.theme.primaryTextColor};

      &:hover {
        transform: scale(1.1); /* Slightly enlarge on hover */
      }
    }
  }

  /* Hover effect for the Plus Icon */
  .plus-icon:hover {
    fill: ${(props) => props.theme.accentColor}; 
    stroke: ${(props) => props.theme.accentColor}; 
`;

/**
 * COMPOSITE PATTERN:
 * ------------------
 * 
 * Organizes the conversations list into a nested structure, 
 * where each conversation is composed of messages. The Composite 
 * Pattern simplifies managing complex hierarchical relationships.
 * 
 * This pattern is particularly useful for group conversations, 
 * which may contain multiple participants and submessages.
*/
const ConversationsList = (props) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const db = getFirestore();
  const auth = getAuth();
  const functions = getFunctions();
  const currentUser = auth.currentUser;
  const history = useHistory();
  const { theme } = props;

  const fetchParticipants = async (members) => {
    const participantProfiles = [];
    for (const memberId of members) {
      if (memberId !== currentUser.uid) {
        try {
          const userRef = doc(db, "profiles", memberId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            participantProfiles.push({
              userId: memberId,
              handle: userData.handle,
              firstname: userData.firstname,
              lastname: userData.lastname,
              fullname: userData.fullname,
              avatarUrl: userData.avatarUrl || "/default-avatar.png",
            });
          } else {
            console.warn(`Profile for user ${memberId} does not exist or lacks permissions.`);
          }
        } catch (error) {
          console.error(`Error fetching profile for user ${memberId}:`, error);
        }
      }
    }
    return participantProfiles;
  };  
  

  useEffect(() => {
    if (currentUser) {
      const conversationsRef = collection(db, "conversations");
      const q = query(conversationsRef, where("members", "array-contains", currentUser.uid));

      const unsubscribe = onSnapshot(
        q,
        async (querySnapshot) => {
          const conversationsPromises = querySnapshot.docs.map(async (docSnap) => {
            const conversationId = docSnap.id;
            const conversationData = docSnap.data();
            
            if (!conversationData) {
              console.warn(`Conversation ${conversationId} data is undefined.`);
              return null;
            }

            try {
              // Check if the conversation has messages before proceeding
            const messagesRef = collection(db, `conversations/${conversationId}/messages`);
            const messagesSnapshot = await getDocs(messagesRef);
            if (messagesSnapshot.empty) {
              // No messages in this conversation, skip it
              return null;
            }

              const participantProfiles = await fetchParticipants(conversationData.members);
              const lastMessageTimestamp = conversationData.lastMessageTimestamp;
              const lastReadTimestamp = conversationData.lastRead?.[currentUser.uid];
              const lastMessageSenderId = conversationData.lastMessageSenderId;

              let hasUnreadMessages = false;

              if (lastMessageTimestamp?.toMillis) {
                if (
                  lastMessageSenderId !== currentUser.uid &&
                  (!lastReadTimestamp || (lastReadTimestamp?.toMillis && lastReadTimestamp.toMillis() < lastMessageTimestamp.toMillis()))
                ) {
                  hasUnreadMessages = true;
                }
              }

              return {
                id: conversationId,
                ...conversationData,
                participantProfiles,
                hasUnreadMessages,
              };
            } catch (error) {
              console.error("Error processing conversation:", error);
              return null;
            }
          });

          const conversationsArray = await Promise.all(conversationsPromises);
          setConversations(conversationsArray.filter(Boolean));
          setLoading(false);
        },
        (error) => {
          console.error("Error listening to conversations:", error);
          setConversations([]);
          setLoading(false);
        }
      );

      const fetchFollowingUsers = async () => {
        try {
          const userProfileRef = doc(db, "profiles", currentUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          if (userProfileSnap.exists()) {
            const userProfileData = userProfileSnap.data();
            const followingIds = Array.isArray(userProfileData.following) ? userProfileData.following : [];

            if (followingIds.length > 0) {
              const followingProfilesPromises = followingIds.map(async (followingId) => {
                const followingUserRef = doc(db, "profiles", followingId);
                const followingUserSnap = await getDoc(followingUserRef);

                if (followingUserSnap.exists()) {
                  const followingUserData = followingUserSnap.data();
                  return {
                    userId: followingId,
                    handle: followingUserData.handle,
                    firstname: followingUserData.firstname,
                    lastname: followingUserData.lastname,
                    fullname: followingUserData.fullname,
                    avatarUrl: followingUserData.avatarUrl || "/default-avatar.png",
                  };
                } else {
                  console.warn(`Profile for user ${followingId} does not exist.`);
                  return null;
                }
              });

              const followingProfiles = await Promise.all(followingProfilesPromises);
              setFollowingUsers(followingProfiles.filter(Boolean));
            } else {
              setFollowingUsers([]);
            }
          } else {
            console.warn(`User profile for ${currentUser.uid} does not exist.`);
            setFollowingUsers([]);
          }
        } catch (error) {
          console.error("Error fetching following users:", error);
          setFollowingUsers([]);
        }
      };

      fetchFollowingUsers();

      return () => {
        unsubscribe(); // Cleanup on unmount to prevent memory leaks
        setConversations([]); // Reset conversations state on unmount
        setLoading(true); // Reset loading state on unmount
      };
    }
  }, [currentUser, db]); 
  

  const handleUserSelection = (user) => {
    setSelectedUsers((prevSelectedUsers) => {
      if (prevSelectedUsers.some((u) => u.userId === user.userId)) {
        return prevSelectedUsers.filter((u) => u.userId !== user.userId);
      } else {
        return [...prevSelectedUsers, user];
      }
    });
  };

  const handleCreateConversation = async () => {
    const user = auth.currentUser;
    if (!user || selectedUsers.length === 0) return;
  
    const members = [user.uid, ...selectedUsers.map((user) => user.userId)];
    const isGroup = members.length > 2;
  
    try {
      const existingConversation = conversations.find((conversation) =>
        conversation.members.length === members.length &&
        members.every((member) => conversation.members.includes(member))
      );
  
      if (existingConversation) {
        history.push(`/conversations/${existingConversation.id}`);
      } else {
        // Create a conversation only if permissions are valid
        const conversationRef = await addDoc(collection(db, "conversations"), {
          members,
          isGroup,
          lastMessageTimestamp: serverTimestamp(),
          lastMessage: "",
          readBy: [user.uid],
        });
  
        setSelectedUsers([]);
        setIsModalOpen(false);
        history.push(`/conversations/${conversationRef.id}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };  

  const handleDeleteConversation = async (conversationId) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this conversation from your list?");
    if (confirmDelete) {
      try {
        const conversationRef = doc(db, "conversations", conversationId);
        
        // Remove current user from the members list
        await updateDoc(conversationRef, {
          members: arrayRemove(currentUser.uid),
        });
  
        // Check if there are remaining members
        const updatedConversation = await getDoc(conversationRef);
        if (updatedConversation.exists() && updatedConversation.data().members.length === 0) {
          await deleteDoc(conversationRef);
          console.log("Conversation deleted because it has no members left.");
        } else {
          console.log("User removed from conversation.");
        }
      } catch (error) {
        console.error("Error removing user from conversation:", error);
      }
    }
  };
  
  
  

  if (loading) return <Loader />;

  return (
    <Wrapper>
      <div className="header">
        <h2>Conversations</h2>
        <PlusIcon onClick={() => setIsModalOpen(true)} className="plus-icon" />
      </div>

      <div>
        {conversations.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="conversation-item"
                onClick={() => history.push(`/conversations/${conversation.id}`)}
              >
                <div className="conversation-details">
                  <div className="avatars">
                    {conversation.participantProfiles.map((participant) => (
                      <Avatar
                        key={participant.userId}
                        src={participant.avatarUrl}
                        alt={participant.handle}
                        className="avatar"
                      />
                    ))}
                  </div>
                  <div className="info">
                    <div className="names">
                      {conversation.participantProfiles.map((participant, index) => (
                        <span key={participant.userId}>
                          {participant.firstname || participant.fullname} {participant.lastname}
                          {index < conversation.participantProfiles.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                    <div className="last-message">
                    {conversation.lastMessage
                      ? conversation.lastMessage.length > 50
                        ? `${conversation.lastMessage.substring(0, 50)}...`
                        : conversation.lastMessage
                      : "No messages yet"}
                    </div>
                  </div>
                </div>
                {conversation.hasUnreadMessages && <div className="unread-indicator"></div>}
                <TrashIcon
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  className="trash-icon"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No conversations found.</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Start New Conversation"
        ariaHideApp={false}
        style={{
          content: {
            maxWidth: "500px",
            margin: "auto",
            padding: "20px",
            inset: "50% auto auto 50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: theme.background,
          },
        }}
      >
        <h2>Select Users to Start a Conversation</h2>
        <div>
          {followingUsers.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, maxHeight: "300px", overflowY: "auto" }}>
              {followingUsers.map((user) => (
                <li key={user.userId} style={{ display: "flex", alignItems: "center", padding: "5px 0" }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.some((u) => u.userId === user.userId)}
                    onChange={() => handleUserSelection(user)}
                  />
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.handle}
                    style={{ width: "40px", height: "40px", margin: "0 10px" }}
                  />
                  <span>{user.firstname || user.fullname} {user.lastname} (@{user.handle})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>You are not following any users.</p>
          )}
        </div>
        <div style={{ marginTop: "20px" }}>
          <Button onClick={handleCreateConversation} disabled={selectedUsers.length === 0}>Start Conversation</Button>
          <Button onClick={() => setIsModalOpen(false)} style={{ marginLeft: "10px" }}>Cancel</Button>
        </div>
      </Modal>
    </Wrapper>
  );
};

export default withTheme(ConversationsList);