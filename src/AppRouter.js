import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Firebase Auth import
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore imports
import Layout from "./styles/Layout";
import Nav from "./components/layout/Nav";
import Home from "./pages/Home";
import MasterQuickie from "./components/Quickie/MasterQuickie";
import Profile from "./components/Profile/Profile";
import Bookmarks from "./pages/Bookmarks";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import EditProfile from "./components/Profile/EditProfile";
import FollowersFollowing from "./components/Profile/FollowersFollowing";
import ConversationsList from "./components/Conversations/ConversationsList";
import ConversationDetail from "./components/Conversations/ConversationDetail";
import ModerationDashboard from "./pages/ContentModeration"; // Content Moderation Page
import Auth from "./components/Auth/Auth"; // Import Auth directly for unauthenticated users

const AppRouter = () => {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    // Watch for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsProfileLoaded(true); // Set as loaded even if not signed in
      console.log("Auth state changed:", currentUser ? "User is logged in" : "No user logged in");
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setIsAdmin(profileData.isAdmin || false);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchProfile();
  }, [user, db]);

  if (!isProfileLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Switch>
        {/* Route accessible to everyone */}
        <Route exact path="/:handle/status/:quickieId" component={MasterQuickie} />

        {/* Routes accessible only to authenticated users */}
        {user ? (
          <>
            {isAdmin && (
              <Route
                path="/ContentModeration"
                render={() => <ModerationDashboard user={user} isAdmin={isAdmin} />}
              />
            )}
            <Route>
              <Nav />
              <Layout>
                <Switch>
                  <Route exact path="/" component={Home} />
                  <Route exact path="/explore" component={Explore} />
                  <Route exact path="/notifications" component={Notifications} />
                  <Route exact path="/bookmarks" component={Bookmarks} />
                  <Route exact path="/conversations" component={ConversationsList} />
                  <Route exact path="/settings/profile" component={EditProfile} />
                  <Route exact path="/:handle" component={Profile} />
                  <Route exact path="/:handle/:type" component={FollowersFollowing} />
                  {/* Catch-All Redirect */}
                  <Route render={() => <Home />} />
                </Switch>
              </Layout>
            </Route>
          </>
        ) : (
          <Auth /> // Render Auth for unauthenticated users
        )}
      </Switch>
    </Router>
  );
};

export default AppRouter;
