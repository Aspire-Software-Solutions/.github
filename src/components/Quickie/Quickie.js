import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";
import DeleteQuickie from "./DeleteQuickie";
import LikeQuickie from "./LikeQuickie";
import { BmIcon, BmFillIcon, CommentIcon, DangerIcon } from "../Icons.js";
import Avatar from "../../styles/Avatar";
import QuickieFile from "../../styles/QuickieFile";
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, increment, getDoc, setDoc } from "firebase/firestore"; // Firestore imports
import { getAuth } from "firebase/auth"; // Firebase Auth
import { toast } from "react-toastify";
import Modal from "../Modal";

const Wrapper = styled.div`
  display: flex;
  border-bottom: 1px solid ${(props) => props.theme.tertiaryColor};
  padding: 1.5rem 1rem 1rem 1rem;

  .quickie-info-user {
    display: flex;
  }

  .quickie-info-user span.username {
    font-weight: 500;
  }

  .quickie-info-user span.secondary {
    padding-left: 0.5rem;
    color: ${(props) => props.theme.secondaryColor};
  }

  .tags {
    display: flex;
  }

  span.tag {
    color: ${(props) => props.theme.accentColor};
    margin-right: 0.4rem;
  }

  div.quickie-stats {
    display: flex;
    margin-top: 0.5rem;
    align-items: center;

    div {
      margin-right: 4rem;
      color: ${(props) => props.theme.secondaryColor};
    }

    svg {
      margin-right: 0.5rem;
    }

    span {
      display: flex;
      align-items: center;
    }

    span.comment {
      svg {
        position: relative;
        top: 4px;
      }
    }
  }

  @media screen and (max-width: 470px) {
    div.quickie-stats {
      div {
        margin-right: 2.5rem;
      }
    }
  }

  @media screen and (max-width: 430px) {
    flex-direction: column;

    .username {
      display: none;
    }

    .avatar {
      display: none;
    }

    .quickie-info-user span.secondary {
      padding-left: 0;
      padding-right: 0.7rem;
    }
  }
`;

const ReportButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.dangerColor}; // Assuming you have a danger color in your theme
  display: flex;
  align-items: center;
  margin-left: 1rem;
`;

const Quickie = ({ quickie, quickieId, quickieData }) => {
  const {
    id,
    text,
    tags,
    userId,
    userAvatar,
    handle,
    userName,
    mediaUrl,
    likes = [], // Ensure likes is an array
    likesCount = 0,
    commentsCount,
    createdAt,
  } = quickie;

  const [isBookmarked, setIsBookmarked] = useState(false); // Track bookmark state
  const [isLiked, setIsLiked] = useState(false); // Track like state
  const [likesNumber, setLikesNumber] = useState(likesCount); // Track the number of likes
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [isModalOpen, setModalOpen] = useState(false);

  // Initialize the like status and likes count on component mount
  useEffect(() => {
    if (currentUser) {
      const isLikedByUser = likes.includes(currentUser.uid);
      setIsLiked(isLikedByUser); // Set isLiked based on whether the user liked the quickie
      setLikesNumber(likesCount); // Ensure likes count is updated from the database
    }
  }, [likes, likesCount, currentUser]);

  // Fetch bookmark status on component mount
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (currentUser) {
        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        const userProfile = profileSnap.data();

        if (userProfile?.bookmarks?.includes(id)) {
          setIsBookmarked(true);
        }
      }
    };

    fetchBookmarkStatus();
  }, [currentUser, db, id]);

  const handleLikeQuickie = async () => {
    if (!currentUser) return; // Ensure user is authenticated

    try {
      const quickieRef = doc(db, "quickies", id);

      if (isLiked) {
        // Remove the user's ID from the likes array and decrement likesCount
        await updateDoc(quickieRef, {
          likes: arrayRemove(currentUser.uid),
          likesCount: increment(-1),
        });
        setLikesNumber(likesNumber - 1);
      } else {
        // Add the user's ID to the likes array and increment likesCount
        await updateDoc(quickieRef, {
          likes: arrayUnion(currentUser.uid),
          likesCount: increment(1),
        });
        setLikesNumber(likesNumber + 1);
      }

      setIsLiked(!isLiked); // Toggle the like state
    } catch (error) {
      console.error("Error liking quickie: ", error);
    }
  };

  const handleBookmarkQuickie = async () => {
    if (!currentUser) return; // Ensure user is authenticated

    try {
      const profileRef = doc(db, "profiles", currentUser.uid);
      if (isBookmarked) {
        await updateDoc(profileRef, {
          bookmarks: arrayRemove(id),
        });
        toast.success("Bookmark removed");
      } else {
        await updateDoc(profileRef, {
          bookmarks: arrayUnion(id),
        });
        toast.success("Quickie bookmarked");
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error updating bookmark: ", error);
      toast.error("Error updating bookmark");
    }
  };

  const strList = text.split(" ");
  const processedText = strList.filter((str) => !str.startsWith("#")).join(" ");

  // Handler to toggle the modal
  const handleReportClick = () => {
    setModalOpen(true);
  };

  // Handler to close the modal
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Firestore submission logic
  const handleSubmitReport = async (reportMessage) => {
    try {
      if (!id) {
        console.error("Quickie ID is undefined");
        return;
      }
  
      const reportDocRef = doc(db, "reports", id);  // Use the Quickie ID
      const quickieDocRef = doc(db, "quickies", id);  // Fetch the original quickie
      
      const quickieSnap = await getDoc(quickieDocRef);
  
      if (quickieSnap.exists()) {
        const originalPosterId = quickieSnap.data().user || "";  // Get original poster's user ID
        const quickieContentType = quickieSnap.data().type || "Text";  // Get the type of content, default to "Text"
        const quickieContent = quickieSnap.data().text || "No content provided";  // Explicitly get the 'text' field
  
        const reportSnap = await getDoc(reportDocRef);
  
        if (reportSnap.exists()) {
          const comments = reportSnap.data().comments || [];  // Ensure comments is an array
  
          // Append the new comment and increment numReports
          await updateDoc(reportDocRef, {
            comments: arrayUnion({
              date: new Date(),
              message: reportMessage,
              user: auth.currentUser.uid
            }),
            numReports: increment(1),
            content: quickieContent,  // Copy the actual text content of the quickie
            type: quickieContentType,  // Set the type based on the quickie content
          });
        } else {
          // If report doesn't exist, create a new one
          await setDoc(reportDocRef, {
            comments: [{
              date: new Date(),
              message: reportMessage,
              user: auth.currentUser.uid
            }],
            numReports: 1,
            rejectReason: "",
            status: "Pending",
            type: quickieContentType,  // Set the type of content (e.g., Text/Image/Video)
            content: quickieContent,  // Set the content of the quickie explicitly from 'text'
            user: originalPosterId  // The original poster's user ID
          });
        }
      } else {
        console.error("Quickie document not found");
        toast.error("Quickie document not found.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);  // Log the error for further inspection
      toast.error("There was an issue submitting your report.");
    }
  };
  
  
  
  
  return (
    <Wrapper>
      <Link to={`/${handle}`}>
        <Avatar className="avatar" src={userAvatar || "/default-avatar.png"} alt="avatar" />
      </Link>

      <div className="quickie-info">
        <div className="quickie-info-user">
          <Link to={`/${handle}`}>
            <span className="username">{userName || "Unknown User"}</span> {/* Show fullname */}
            <span className="secondary">{`@${handle}`}</span> {/* Show handle */}
            <span className="secondary">{moment(createdAt?.toDate()).fromNow()}</span>
          </Link>
        </div>

        <Link to={`/${handle}/status/${id}`}>
          <p>{processedText}</p>
        </Link>

        <div className="tags">
          {tags.length
            ? tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))
            : null}
        </div>

        <Link to={`/${handle}/status/${id}`}>
          {mediaUrl ? (
          <QuickieFile newquickie src={mediaUrl} alt="quickie-file" />
          ) : (
            null  // Don't display anything if there's no mediaUrl
          )}
        </Link>



        <div className="quickie-stats">
          <div>
            <span className="comment">
              <Link to={`/${handle}/status/${id}`}>
                <CommentIcon />
                {commentsCount ? commentsCount : null}
              </Link>
            </span>
          </div>

          <div>
            <LikeQuickie
              id={id}
              isLiked={isLiked}
              likesCount={likesNumber}
              handleLikeQuickie={handleLikeQuickie}
            />
          </div>

          
          <div onClick={handleBookmarkQuickie} style={{ cursor: 'pointer' }}>
              {isBookmarked ? <BmFillIcon /> : <BmIcon />}
          </div>

          <div>
              {currentUser && currentUser.uid === userId && (
              <DeleteQuickie id={id} />
              )}
          </div>

          {/* Add the Report Button */}
          <ReportButton onClick={handleReportClick}>
            <DangerIcon /> {/* Assuming you have a "danger" styled icon */}
            <span>Report</span>
          </ReportButton>
        </div>

        {/* Modal */}
        {isModalOpen && (
        <Modal 
          onClose={handleCloseModal} 
          onSubmit={handleSubmitReport}  // Pass the Firestore handler to the modal
        />
      )}
      </div>
    </Wrapper>
  );
};

export default Quickie;