import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Button from "../../styles/Button"; // Import your button component
import SearchInputForMessages from "./SearchInputForMessages"; // Use the search component specifically for messages
import Loader from "../Loader";
import { Link } from "react-router-dom"; // For linking to conversation details

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
const ConversationsList = () => {
  const [selectedUsers, setSelectedUsers] = useState([]); // State to track selected users
  const [conversations, setConversations] = useState([]); // State to track conversations
  const [loading, setLoading] = useState(true); // State for loading
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fetch conversation participants' profile information
  const fetchParticipants = async (members) => {
    const participantHandles = [];
    for (const memberId of members) {
      const userRef = doc(db, "profiles", memberId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Exclude the logged-in user's UID
        if (memberId !== currentUser.uid) {
          participantHandles.push(userData.handle); // Or use 'firstname lastname' if preferred
        }
      }
    }
    return participantHandles;
  };

  useEffect(() => {
    if (currentUser) {
      const conversationsRef = collection(db, "conversations");

      // Query conversations where the current user is a member
      const q = query(conversationsRef, where("members", "array-contains", currentUser.uid));

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const fetchedConversations = [];
        for (const docSnap of querySnapshot.docs) {
          const conversationData = docSnap.data();
          const participantHandles = await fetchParticipants(conversationData.members);
          fetchedConversations.push({
            id: docSnap.id,
            ...conversationData,
            participantHandles, // Add participants' handles to the conversation
          });
        }
        setConversations(fetchedConversations);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser, db]);

  const handleUserSelection = (user) => {
    // Add or remove users when clicked
    setSelectedUsers((prevSelectedUsers) => {
      if (prevSelectedUsers.some((u) => u.id === user.id)) {
        return prevSelectedUsers.filter((u) => u.id !== user.id);
      } else {
        return [...prevSelectedUsers, user];
      }
    });
  };

  const handleCreateConversation = async () => {
    const user = auth.currentUser;
    if (!user || selectedUsers.length === 0) return;
  
    const members = [user.uid, ...selectedUsers.map((user) => user.id)];
    const isGroup = members.length > 2;
  
    try {
      // Create a new conversation
      const conversationRef = await addDoc(collection(db, "conversations"), {
        members,
        isGroup,
        lastMessageAt: serverTimestamp(),
        lastMessage: "",
        readBy: [user.uid],
      });
  
      console.log("Conversation created with ID:", conversationRef.id);
  
      // Create a placeholder message in the 'messages' subcollection
      await addDoc(collection(db, `conversations/${conversationRef.id}/messages`), {
        senderId: user.uid,
        messageText: "Conversation started.",
        messageImageUrl: null,
        timestamp: serverTimestamp(),
        readBy: [user.uid],
      });
  
      console.log("Placeholder message added to conversation:", conversationRef.id);
  
      setSelectedUsers([]); // Reset after creation
    } catch (error) {
      console.error("Error creating conversation or message:", error);
    }
  };
  

  if (loading) return <Loader />;

  return (
    <div>
      <h2>Conversations</h2>
      <SearchInputForMessages onUserSelect={handleUserSelection} />

      {/* Display selected users */}
      {selectedUsers.length > 0 && (
        <div>
          <h3>Selected Users</h3>
          <ul>
            {selectedUsers.map((user) => (
              <li key={user.id}>
                {user.firstname} {user.lastname} (@{user.handle})
              </li>
            ))}
          </ul>
          <Button onClick={handleCreateConversation}>Start Conversation</Button>
        </div>
      )}
      {selectedUsers.length === 0 && <p>No users selected. Search to start a conversation.</p>}

      {/* Display conversation list */}
      <div>
        {conversations.length > 0 ? (
          <ul>
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link to={`/conversations/${conversation.id}`}>
                  {conversation.participantHandles.join(", ")} - Last message:{" "}
                  {conversation.lastMessage || "No messages yet"}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No conversations found.</p>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
