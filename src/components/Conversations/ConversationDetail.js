import React, { useEffect, useState, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  getFirestore,
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Message from "./Message";
import SendMessage from "./SendMessage";
import Loader from "../Loader";

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageSent, setMessageSent] = useState(false);
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const history = useHistory();
  const messagesEndRef = useRef(null);
  const messageRefs = useRef([]);

  const scrollToMessage = (index) => {
    if (messageRefs.current[index]) {
      messageRefs.current[index].scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateLastReadIfNeeded = async (msgs) => {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      const lastMessage = msgs[msgs.length - 1];

      if (lastMessage && (!lastMessage.readBy || !lastMessage.readBy.includes(currentUser.uid))) {
        await updateDoc(conversationRef, {
          [`lastRead.${currentUser.uid}`]: serverTimestamp(),
          readBy: arrayUnion(currentUser.uid),
        });
      }
    } catch (error) {
      console.error("Error updating lastRead:", error);
    }
  };

  useEffect(() => {
    if (!conversationId) {
      setError("Invalid conversation ID");
      setLoading(false);
      return;
    }

    const fetchMessages = () => {
      const messagesRef = collection(db, `conversations/${conversationId}/messages`);
      const q = query(messagesRef, orderBy("timestamp", "asc"));
    
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const msgs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
        setMessages(msgs);
        setLoading(false);
    
        await updateLastReadIfNeeded(msgs);
    
        // Scroll to the oldest unread message if there is one; otherwise, scroll to the bottom
        const oldestUnreadIndex = msgs.findIndex(
          (msg) => !(msg.readBy && msg.readBy.includes(currentUser.uid))
        );
    
        if (oldestUnreadIndex !== -1) {
          scrollToMessage(oldestUnreadIndex);
        }
    
        // Always scroll to the bottom whenever messages update to ensure the latest message is in view
        scrollToBottom();
      });
    
      return unsubscribe;
    };    

    const unsubscribe = fetchMessages();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, db, currentUser]);

  const handleDeleteConversation = async () => {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const querySnapshot = await getDocs(messagesRef);
    if (querySnapshot.empty) {
      const conversationRef = doc(db, "conversations", conversationId);
      await deleteDoc(conversationRef);
      console.log("Conversation deleted due to no messages.");
    }
  };

// Call this on component unmount if no message was sent
useEffect(() => {
  return () => {
    handleDeleteConversation();
  };
}, [conversationId, messageSent]);

  if (loading) return <Loader />;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Conversation</h2>
      <div className="messages" style={{ maxHeight: "400px", overflowY: "auto" }}>
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div key={msg.id} ref={(el) => (messageRefs.current[index] = el)}>
              <Message message={msg} currentUserId={currentUser.uid} />
            </div>
          ))
        ) : (
          <p>No messages yet.</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <SendMessage conversationId={conversationId} setMessageSent={setMessageSent} scrollToBottom={scrollToBottom} />
    </div>
  );
};

export default ConversationDetail;
