// MentionDropdown.js
import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MentionDropdown = ({ queryText, context, postId, insertMention }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const auth = getAuth();
  const db = getFirestore();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchFollowingUsers = async () => {
      try {
        // Fetch the current user's following list
        const userRef = doc(db, 'profiles', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const followingIds = userData.following || [];

          // Fetch the profiles of all users in the following list
          let followingProfiles = [];
          if (followingIds.length > 0) {
            // Firestore limits the 'in' query to 10 items
            // We need to batch the queries
            const batchSize = 10;
            for (let i = 0; i < followingIds.length; i += batchSize) {
              const batch = followingIds.slice(i, i + batchSize);
              const q = query(
                collection(db, 'profiles'),
                where('userId', 'in', batch)
              );
              const querySnapshot = await getDocs(q);
              querySnapshot.forEach((doc) => {
                const profile = doc.data();
                followingProfiles.push(profile);
              });
            }
          }

          // Set the users state
          setUsers(followingProfiles);
        } else {
          console.error('User profile not found');
        }
      } catch (error) {
        console.error('Error fetching following users:', error);
      }
    };

    fetchFollowingUsers();
  }, [db, currentUser]);

  useEffect(() => {
    // Filter the users list based on queryText
    if (!queryText) {
      // If queryText is empty (i.e., the user has just typed '@')
      // Show all users
      setFilteredUsers(users);
    } else {
      const regex = new RegExp(`${queryText}`, 'i'); // Case-insensitive matching
      const filtered = users.filter((user) => {
        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
        return (
          regex.test(user.handle) ||
          regex.test(user.firstname) ||
          regex.test(user.lastname) ||
          regex.test(fullName)
        );
      });
      setFilteredUsers(filtered);
    }
  }, [queryText, users]);

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #ccc',
        maxHeight: '150px',
        overflowY: 'auto',
        position: 'absolute',
        width: '300px',
        zIndex: 1000,
      }}
    >
      {filteredUsers.length > 0 ? (
        filteredUsers.map((user) => (
          <div
            key={user.userId}
            onClick={() => insertMention(user.handle)}
            style={{
              padding: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img
              src={user.avatarUrl || '/default-avatar.png'}
              alt={user.handle}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                marginRight: '10px',
              }}
            />
            <div>
              <div>
                {user.firstname} {user.lastname}
              </div>
              <div style={{ color: 'gray' }}>@{user.handle}</div>
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '5px' }}>No users found</div>
      )}
    </div>
  );
};

export default MentionDropdown;
