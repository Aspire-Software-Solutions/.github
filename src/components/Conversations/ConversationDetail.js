import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, collection, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Message from "./Message";
import SendMessage from "./SendMessage";
import Loader from "../Loader";

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state for better error handling
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  /**
   * OBSERVER PATTERN:
   * -----------------
   * 
   * Observes real-time updates to the messages in the conversation.
   * By subscribing to `onSnapshot`, it listens for new messages and 
   * re-renders the conversation when there’s a change, providing 
   * dynamic, up-to-date content.
  */
  useEffect(() => {
    if (!conversationId) {
      setError("Invalid conversation ID");
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const messagesRef = collection(db, `conversations/${conversationId}/messages`);
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const msgs = [];
          querySnapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() });
          });

          setMessages(msgs);
          setLoading(false); // Set loading to false once messages are fetched
        });

        // Mark the messages as read by the current user
        const markAsRead = async () => {
          const conversationRef = doc(db, "conversations", conversationId);
          await updateDoc(conversationRef, {
            readBy: [...new Set([...(messages.map(msg => msg.readBy || [])), currentUser.uid])],
          });
        };

        markAsRead();
        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages. Please try again later.");
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, db, currentUser]);

  if (loading) return <Loader />;
  if (error) return <div>{error}</div>; // Display error message if there's an error

  return (
    <div>
      <h2>Conversation</h2>
      <div className="messages">
        {messages.length > 0 ? (
          messages.map((msg) => <Message key={msg.id} message={msg} />)
        ) : (
          <p>No messages yet.</p>
        )}
      </div>
      <SendMessage conversationId={conversationId} />
    </div>
  );
};

export default ConversationDetail;
