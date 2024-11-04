import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { getFirestore, collection, query, where, onSnapshot, orderBy, limit, startAfter } from "firebase/firestore";
import Loader from "./Loader";
import Quickie from "./Quickie/Quickie";
import CustomResponse from "./CustomResponse";
import { getAuth } from "firebase/auth";

const Wrapper = styled.div`
  margin-bottom: 7rem;
`;

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${(props) => (props.isActive ? "green" : "gray")};
`;

const FeedList = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null); // To store the last visible document for pagination
  const [hasMore, setHasMore] = useState(true); // To track if more posts can be loaded
  const [userStatuses, setUserStatuses] = useState({}); // To store online statuses
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
          setFeedData(loadedFeed);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          
          // Fetch active status for users in the feed
          fetchActiveStatuses(userAndFollowing);
        } else {
          setHasMore(false); // No more posts to load
        }
        setLoading(false);
      });
    });
  };

  // Function to fetch online statuses of friends
  const fetchActiveStatuses = async (userIds) => {
    const profileRef = collection(db, "profiles");
    const statusQuery = query(profileRef, where("userId", "in", userIds));

    onSnapshot(statusQuery, (snapshot) => {
      const statuses = {};
      snapshot.forEach((doc) => {
        statuses[doc.id] = doc.data().isActive;
      });
      setUserStatuses(statuses);
      console.log("===> status ===>", statuses)
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
        startAfter(lastVisible),
        limit(15)
      );

      onSnapshot(feedQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const moreFeed = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFeedData((prevFeedData) => [...prevFeedData, ...moreFeed]);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          
          // Fetch active status for new users
          fetchActiveStatuses(userAndFollowing);
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
        loadMoreFeed();
      }
    });
    if (node) observer.current.observe(node);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  if (loading) return <Loader />;

  return (
    <Wrapper>
      {feedData.length ? (
        feedData.map((quickie, index) => {
          const isActive = userStatuses[quickie.userId];
          
          return (
            <div ref={index === feedData.length - 1 ? lastQuickieElementRef : null} key={quickie.id}>
              <StatusDot isActive={isActive} />
              <Quickie quickie={quickie} />
            </div>
          );
        })
      ) : (
        <CustomResponse text="Follow some people to get some feed updates" />
      )}
    </Wrapper>
  );
};

export default FeedList;
