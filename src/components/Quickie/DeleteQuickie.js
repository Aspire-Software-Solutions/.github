import React from "react";
import { toast } from "react-toastify";
import { TrashIcon } from "../Icons";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore"; // Firestore
import { getStorage, ref, deleteObject } from "firebase/storage"; // Firebase Storage
import { getAuth } from "firebase/auth"; // Firebase Auth

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
    const confirmDelete = window.confirm("Are you sure you want to delete this quickie?");
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

        toast.success("Your quickie has been deleted");
      } else {
        toast.error("Quickie not found.");
      }
    } catch (error) {
      toast.error("Failed to delete quickie.");
      console.error("Error deleting quickie:", error);
    }
  };

  return <TrashIcon onClick={handleDeleteQuickie} />;
};

export default DeleteQuickie;
