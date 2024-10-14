import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { getFirestore, collection, query, where, onSnapshot, orderBy, limit, startAfter } from "firebase/firestore"; // Firestore
import Loader from "./Loader";
import Quickie from "./Quickie/Quickie";
import CustomResponse from "./CustomResponse";
import { getAuth } from "firebase/auth"; // Firebase Auth

const Wrapper = styled.div`
  margin-bottom: 7rem;
`;

const FeedList = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null); // To store the last visible document for pagination
  const [hasMore, setHasMore] = useState(true); // To track if more posts can be loaded
  const db = getFirestore();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const observer = useRef(); // Observer for lazy loading

  // Function to load the initial 15 quickies
  const fetchFeed = async () => {
    if (!currentUser) return;

    const profileRef = collection(db, "profiles");
    const feedRef = collection(db, "quickies");

    const profileQuery = query(profileRef, where("userId", "==", currentUser.uid));
    let following = [];

    onSnapshot(profileQuery, async (profileSnapshot) => {
      if (!profileSnapshot.empty) {
        const userProfile = profileSnapshot.docs[0].data();
        following = userProfile.following || [];
      }

      const userAndFollowing = [...following, currentUser.uid];

      // Initial query to get the first 15 posts
      const feedQuery = query(
        feedRef,
        where("userId", "in", userAndFollowing),
        orderBy("createdAt", "desc"),
        limit(15)
      );

      onSnapshot(feedQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const loadedFeed = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFeedData(loadedFeed); // Set the initial feed data
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]); // Set the last visible post
        } else {
          setHasMore(false); // No more posts to load
        }
        setLoading(false);
      });
    });
  };

  // Function to load more quickies when user scrolls down
  const loadMoreFeed = async () => {
    if (!lastVisible || !currentUser || !hasMore) return;

    const profileRef = collection(db, "profiles");
    const feedRef = collection(db, "quickies");

    const profileQuery = query(profileRef, where("userId", "==", currentUser.uid));
    let following = [];

    onSnapshot(profileQuery, async (profileSnapshot) => {
      if (!profileSnapshot.empty) {
        const userProfile = profileSnapshot.docs[0].data();
        following = userProfile.following || [];
      }

      const userAndFollowing = [...following, currentUser.uid];

      // Query to get the next 15 posts starting after the last loaded one
      const feedQuery = query(
        feedRef,
        where("userId", "in", userAndFollowing),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible), // Start after the last visible post
        limit(15)
      );

      onSnapshot(feedQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const moreFeed = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFeedData((prevFeedData) => [...prevFeedData, ...moreFeed]); // Append new posts to the existing feed
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]); // Update the last visible post
        } else {
          setHasMore(false); // No more posts to load
        }
        setLoading(false);
      });
    });
  };

  // Intersection observer for lazy loading
  const lastQuickieElementRef = (node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreFeed(); // Load more quickies if user reaches the bottom
      }
    });
    if (node) observer.current.observe(node);
  };

  useEffect(() => {
    fetchFeed(); // Load the initial feed when component mounts
  }, []);

  if (loading) return <Loader />;

  return (
    <Wrapper>
      {feedData.length ? (
        feedData.map((quickie, index) => {
          // If it's the last quickie in the current feed, attach the observer to trigger loading more
          if (feedData.length === index + 1) {
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
