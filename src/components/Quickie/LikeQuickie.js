import React from "react";
import { HeartIcon, HeartFillIcon } from "../Icons";
import { getAuth } from "firebase/auth"; // Firebase Auth

/**
 * COMMAND PATTERN:
 * ----------------
 * 
 * Encapsulates the like action, allowing it to be executed 
 * independently and providing flexibility for additional functionality
 * (e.g., undo or logging).
 */
const LikeQuickie = ({ isLiked, likesCount, handleLikeQuickie }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    return null; // No rendering for unauthenticated users
  }

  return (
    <span>
      {isLiked ? (
        <HeartFillIcon color="#E0245E" onClick={handleLikeQuickie} />
      ) : (
        <HeartIcon onClick={handleLikeQuickie} />
      )}
      {likesCount ? likesCount : null}
    </span>
  );
};

export default LikeQuickie;
