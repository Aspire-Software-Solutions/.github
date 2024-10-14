import React, { useState } from "react";
import { getFirestore, doc, addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth";
import Button from "../../styles/Button";

const SendMessage = ({ conversationId }) => {
  const [messageText, setMessageText] = useState("");
  const [imageFile, setImageFile] = useState(null); // To handle image sending
  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !imageFile) return;

    try {
      // Reference the conversation document
      const conversationRef = doc(db, "conversations", conversationId);

      // Create a new message in the messages subcollection
      await addDoc(collection(conversationRef, "messages"), {
        senderId: currentUser.uid,
        messageText: messageText || "",
        messageImageUrl: imageFile || null, // Handle if an image is sent
        timestamp: serverTimestamp(), // Ensure the timestamp is set correctly
        readBy: [currentUser.uid] // Add the current user to the readBy array
      });

      // Update the conversation document with the last message details
      await updateDoc(conversationRef, {
        lastMessage: messageText || "Photo", // Set to "Photo" if only an image is sent
        lastMessageAt: serverTimestamp(),
        readBy: [currentUser.uid] // Mark the conversation as read by the sender
      });

      // Clear the input fields after sending the message
      setMessageText("");
      setImageFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  return (
    <div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export default SendMessage;
