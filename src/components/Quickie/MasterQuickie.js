import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Header from "../Header";
import Loader from "../Loader";
import Quickie from "./Quickie";
import Comment from "../Comment/Comment";
import AddComment from "../Comment/AddComment";
import CustomResponse from "../CustomResponse";
import { getFirestore, doc, onSnapshot } from "firebase/firestore"; // Firestore imports for real-time
import { sortFn } from "../../utils";

const Wrapper = styled.div`
  margin-bottom: 7rem;
`;

/**
 * TEMPLATE METHOD PATTERN:
 * ------------------------
 * 
 * Provides a template for handling quickie interactions.
 * Each specific interaction (like, comment, share) can be implemented 
 * as a separate method, following the shared sequence of actions.
*/
const MasterQuickie = () => {
  const { quickieId } = useParams();
  const [quickieData, setQuickieData] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(); // Firestore instance

  useEffect(() => {
    const quickieRef = doc(db, "quickies", quickieId);

    // Real-time listener for the quickie and its comments
    const unsubscribe = onSnapshot(quickieRef, (quickieSnap) => {
      if (quickieSnap.exists()) {
        const quickie = quickieSnap.data();

        // Set quickie data
        setQuickieData({ id: quickieId, ...quickie });

        // Fetch the comments array directly from the quickie document
        const commentsArray = quickie.comments || []; // Use an empty array if no comments exist
        setComments(commentsArray.sort(sortFn)); // Sort the comments by createdAt
      } else {
        setQuickieData(null);
      }
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [quickieId, db]);

  return (
    <Wrapper>
      <Header>
        <span>Attack</span>
      </Header>
      {loading ? (
        <Loader />
      ) : (
        <>
          {quickieData ? (
            <>
              <Quickie quickie={quickieData} />
              <AddComment id={quickieData.id} />
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <Comment key={index} comment={comment} />
                ))
              ) : (
                <p>No comments yet.</p>
              )}
            </>
          ) : (
            <CustomResponse text="Oops, the attack you are looking for doesn't seem to exist." />
          )}
        </>
      )}
    </Wrapper>
  );
};

export default MasterQuickie;
