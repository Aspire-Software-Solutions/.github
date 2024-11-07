import React, { useEffect, useState, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore"; // Firestore
import Loader from "./Loader";
import Quickie from "./Quickie/Quickie";
import CustomResponse from "./CustomResponse";
import { getAuth } from "firebase/auth"; // Firebase Auth

const Wrapper = styled.div`
  margin-bottom: 7rem;
`;

const FeedList = () => {
  const [feedData, setFeedData] = useState([]);
  const [displayedFeedData, setDisplayedFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsToShow, setPostsToShow] = useState(15);
  const db = getFirestore();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const observer = useRef(); // Observer for lazy loading

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    let unsubscribe;
    const fetchData = async () => {
      unsubscribe = await fetchFeed();
    };

    fetchData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const fetchFeed = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const profileRef = collection(db, "profiles");
    const feedRef = collection(db, "quickies");

    const profileQuery = query(profileRef, where("userId", "==", currentUser.uid));
    const profileSnapshot = await getDocs(profileQuery);

    let following = [];

    if (!profileSnapshot.empty) {
      const userProfile = profileSnapshot.docs[0].data();
      following = userProfile.following || [];
    }

    const userAndFollowing = [...following, currentUser.uid];

    // Handle Firestore's 'in' query limitation
    const chunks = [];
    const chunkSize = 10;

    for (let i = 0; i < userAndFollowing.length; i += chunkSize) {
      chunks.push(userAndFollowing.slice(i, i + chunkSize));
    }

    const unsubscribes = [];

    chunks.forEach((chunk) => {
      const feedQuery = query(
        feedRef,
        where("userId", "in", chunk),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const unsubscribe = onSnapshot(feedQuery, (querySnapshot) => {
        setFeedData((prevFeedData) => {
          let updatedFeedData = [...prevFeedData];

          querySnapshot.docChanges().forEach((change) => {
            const docData = {
              id: change.doc.id,
              ...change.doc.data(),
            };

            if (change.type === "added") {
              // Avoid duplicates
              if (!updatedFeedData.some((item) => item.id === docData.id)) {
                updatedFeedData.push(docData);
              }
            } else if (change.type === "modified") {
              // Update the existing item
              updatedFeedData = updatedFeedData.map((item) =>
                item.id === docData.id ? docData : item
              );
            } else if (change.type === "removed") {
              // Remove the item
              updatedFeedData = updatedFeedData.filter((item) => item.id !== docData.id);
            }
          });

          // Sort the updated feed data
          updatedFeedData.sort((a, b) => {
            const aCreatedAt = a.createdAt ? a.createdAt.toMillis() : 0;
            const bCreatedAt = b.createdAt ? b.createdAt.toMillis() : 0;
            return bCreatedAt - aCreatedAt;
          });

          return updatedFeedData;
        });
        setLoading(false);
      });

      unsubscribes.push(unsubscribe);
    });

    // Return a function to unsubscribe all listeners
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };

  // Update displayedFeedData based on feedData and postsToShow
  useEffect(() => {
    setDisplayedFeedData(feedData.slice(0, postsToShow));
  }, [feedData, postsToShow]);

  // Use a callback ref for the last item
  const lastQuickieElementRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && postsToShow < feedData.length) {
          setPostsToShow((prev) => prev + 15);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, postsToShow, feedData.length]
  );

  if (loading) return <Loader />;

  return (
    <Wrapper>
      {displayedFeedData.length ? (
        displayedFeedData.map((quickie, index) => {
          if (displayedFeedData.length === index + 1) {
            return (
              <div ref={lastQuickieElementRef} key={quickie.id}>
                <Quickie quickie={quickie} />
              </div>
            );
          } else {
            return <Quickie key={quickie.id} quickie={quickie} />;
          }
        })
      ) : (
        <CustomResponse text="Follow some people to get some feed updates" />
      )}
    </Wrapper>
  );
};

export default FeedList;
