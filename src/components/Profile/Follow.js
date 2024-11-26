import React, { useState, useEffect } from "react";
import Button from "../../styles/Button";
import { displayError } from "../../utils";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const Follow = ({ isFollowing, userId, sm = false, relative = false }) => {
  const [followState, setFollowState] = useState(isFollowing);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchFollowState = async () => {
      if (!currentUser || !userId) return;

      try {
        const currentUserRef = doc(db, "profiles", currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);

        if (currentUserDoc.exists()) {
          const currentUserData = currentUserDoc.data();
          const following = currentUserData.following || [];
          setFollowState(following.includes(userId));
        }
      } catch (error) {
        console.error("Error fetching follow state:", error);
        setFollowState(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowState();
  }, [db, currentUser, userId]);

  const handleFollow = async () => {
    if (!currentUser) {
      displayError(new Error("Please sign in to follow/unfollow users"));
      return;
    }

    if (isProcessing || currentUser.uid === userId) {
      return;
    }

    setIsProcessing(true);
    const newFollowState = !followState;

    try {
      const userRef = doc(db, "profiles", userId);
      const currentUserRef = doc(db, "profiles", currentUser.uid);

      const [userDoc, currentUserDoc] = await Promise.all([
        getDoc(userRef),
        getDoc(currentUserRef),
      ]);

      if (!userDoc.exists() || !currentUserDoc.exists()) {
        throw new Error("Profile not found");
      }

      const userData = userDoc.data();
      const currentUserData = currentUserDoc.data();

      // Ensure arrays exist
      const followers = userData.followers || [];
      const following = currentUserData.following || [];

      if (newFollowState) {
        // Follow
        if (userData.privateAccount) {
          // Private account follow request logic
          const requestDoc = await addDoc(collection(db, "followRequests"), {
            fromUserId: currentUser.uid,
            toUserId: userId,
            createdAt: new Date(),
            status: "pending",
          });

          // Notify the private account user
          await addDoc(collection(db, "notifications"), {
            type: "follow_request",
            fromUserId: currentUser.uid,
            userId: userId,
            createdAt: new Date(),
            isRead: false,
            message: "wants to follow you.",
            requestId: requestDoc.id,
          });

          console.log("Follow request sent to private account.");
        } else {
          // Public account follow logic
          if (!followers.includes(currentUser.uid)) {
            await updateDoc(userRef, {
              followers: arrayUnion(currentUser.uid),
              followersCount: increment(1),
            });
          }

          if (!following.includes(userId)) {
            await updateDoc(currentUserRef, {
              following: arrayUnion(userId),
              followingCount: increment(1),
            });
          }
        }
      } else {
        // Unfollow
        if (followers.includes(currentUser.uid)) {
          await updateDoc(userRef, {
            followers: arrayRemove(currentUser.uid),
            followersCount: increment(-1),
          });
        }

        if (following.includes(userId)) {
          await updateDoc(currentUserRef, {
            following: arrayRemove(userId),
            followingCount: increment(-1),
          });
        }
      }

      setFollowState(newFollowState);
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      if (error.code === "permission-denied") {
        displayError(new Error("Unable to update follow status. Please try again."));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return null;

  return (
    <Button
      outline
      sm={sm}
      relative={relative}
      onClick={handleFollow}
      disabled={isProcessing || currentUser?.uid === userId}
    >
      {isProcessing ? "Processing..." : followState ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default Follow;
