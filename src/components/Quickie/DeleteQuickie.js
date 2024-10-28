import React from "react";
import { toast } from "react-toastify";
import { TrashIcon } from "../Icons";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore"; // Firestore
import { getStorage, ref, deleteObject } from "firebase/storage"; // Firebase Storage
import { getAuth } from "firebase/auth"; // Firebase Auth

/**
 * COMMAND PATTERN:
 * ----------------
 * 
 * Encapsulates the delete action, allowing it to be executed 
 * independently and providing flexibility for additional functionality
 * (e.g., undo or logging).
 */
const DeleteQuickie = ({ id }) => {
  const db = getFirestore();
  const storage = getStorage(); // Firebase Storage instance
  const auth = getAuth();
  const user = auth.currentUser;

  const handleDeleteQuickie = async () => {
    if (!user) {
      toast.error("You need to be logged in to delete a quickie.");
      return;
    }

    // Ask for confirmation before deletion
    const confirmDelete = window.confirm("Are you sure you want to delete this attack?");
    if (!confirmDelete) return; // Exit if user cancels

    const quickieRef = doc(db, "quickies", id);

    try {
      // Get the quickie document to check for mediaUrl
      const quickieSnap = await getDoc(quickieRef);
      if (quickieSnap.exists()) {
        const quickieData = quickieSnap.data();
        const mediaUrl = quickieData.mediaUrl;

        // If the quickie has a mediaUrl, delete the file from Firebase Storage
        if (mediaUrl) {
          const mediaRef = ref(storage, mediaUrl);
          await deleteObject(mediaRef);
        }

        // Delete the quickie from Firestore
        await deleteDoc(quickieRef);

        toast.success("Your attack has been deleted");
      } else {
        toast.error("Attack not found.");
      }
    } catch (error) {
      toast.error("Failed to delete attack.");
      console.error("Error deleting attack:", error);
    }
  };

  return <TrashIcon onClick={handleDeleteQuickie} />;
};

export default DeleteQuickie;
