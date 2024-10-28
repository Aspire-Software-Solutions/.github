import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from "react-toastify";
import Button from "../../styles/Button";
import { CloseIcon, UploadFileIcon } from "../Icons";

const SendMessage = ({ conversationId, setMessageSent }) => {
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [hasMessageSent, setHasMessageSent] = useState(false); // Tracks if a message was sent
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const currentUser = auth.currentUser;

  /**
   * COMMAND PATTERN:
   * ----------------
   * 
   * Encapsulates the action of sending a message as a command, 
   * enabling additional functionality such as undoing, retrying, or 
   * scheduling messages in the future.
   * 
   * This pattern enhances the flexibility and functionality of the 
   * messaging system, especially for asynchronous operations.
  */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !mediaFile) return;

    try {
      let uploadedMediaUrl = null;

      // If there is a media file, upload it to Firebase Storage
      if (mediaFile) {
        const fileType = mediaFile.type.split("/")[0];
        const storageRef = ref(storage, `conversations/${conversationId}/${mediaFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, mediaFile);

        uploadedMediaUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            (error) => {
              toast.error("Failed to upload media");
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      }

      // Reference the conversation document
      const conversationRef = doc(db, "conversations", conversationId);
      
      /**
       * FACTORY PATTERN:
       * ----------------
       * 
       * Provides a standardized method to create message objects
       * with the required properties, ensuring all messages follow
       * the same structure.
       * 
       * This pattern simplifies the addition of new message fields and 
       * makes the codebase easier to manage.
      */
      // Create a new message in Firestore with the image or video URL
        const messageRef = await addDoc(collection(conversationRef, "messages"), {
        senderId: currentUser.uid,
        messageText: messageText || "",
        messageImageUrl: uploadedMediaUrl || null,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
      });

      const messageSnapshot = await getDoc(messageRef);
      const messageData = messageSnapshot.data();
      const messageTimestamp = messageData.timestamp;

      // Update the conversation document with the last message details
      await updateDoc(conversationRef, {
        lastMessage: messageText || (mediaFile ? "Media" : ""),
        lastMessageTimestamp: messageTimestamp,
        lastMessageSenderId: currentUser.uid,
        [`lastRead.${currentUser.uid}`]: messageTimestamp,
      });

      setHasMessageSent(true); // Mark as sent to prevent deletion
      setMessageSent(true); // Notify parent that a message has been sent
      setMessageText("");
      setMediaFile(null);
      setMediaUrl(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaUrl(null);
  };
  
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const fileType = file.type.split("/")[0];
    if (fileType === "image" && file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    if (fileType === "video" && file.size > 100 * 1024 * 1024) {
      toast.error("Video must be smaller than 100MB");
      return;
    }
  
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
  };

  // Clean up empty conversations when the user leaves the page without sending a message
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!hasMessageSent) {
        await deleteDoc(doc(db, "conversations", conversationId));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [conversationId, db, hasMessageSent]);

  return (
    <div>
      <form
        onSubmit={handleSendMessage}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          position: "relative",
        }}
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1 }}
        />

        {mediaUrl && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                cursor: "pointer",
                zIndex: 2,
                color: "red",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: "50%",
              }}
              onClick={handleRemoveMedia}
            >
              <CloseIcon />
            </div>
            {mediaFile && mediaFile.type.startsWith("video") ? (
              <video controls src={mediaUrl} width="100px" height="100px" />
            ) : (
              <img
                src={mediaUrl}
                alt="Media preview"
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
            )}
          </div>
        )}

        <label
          htmlFor="mediaUpload"
          style={{
            cursor: "pointer",
            margin: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <UploadFileIcon />
        </label>
        <input
          id="mediaUpload"
          type="file"
          accept="image/*, video/*"
          onChange={handleMediaUpload}
          style={{ display: "none" }}
        />

        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};

export default SendMessage;
