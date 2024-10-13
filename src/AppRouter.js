import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import Layout from "./styles/Layout";
import Nav from "./components/layout/Nav";
import Home from "./pages/Home";
import MasterQuickie from "./components/Quickie/MasterQuickie"; // Renamed for consistency
import Profile from "./components/Profile/Profile";
import Bookmarks from "./pages/Bookmarks";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import Suggestion from "./pages/Suggestion";
import EditProfile from "./components/Profile/EditProfile";
import ModerationDashboard from "./pages/ContentModeration";

const AppRouter = () => {
  const auth = getAuth();
  const user = auth.currentUser; // Get the currently logged-in user
  const [isAdmin, setIsAdmin] = useState(false); // Store isAdmin state
  const [isProfileLoaded, setIsProfileLoaded] = useState(false); // Check if profile is loaded
  const db = getFirestore(); // Initialize Firestore
  const messaging = getMessaging(); // Initialize FCM (Firebase Cloud Messaging)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setIsAdmin(profileData.isAdmin || false);

            // Check the user's moderation status and show a pop-up
            const reportRef = doc(db, 'reports', user.uid); // Assuming 'reports' is where moderation data is stored
            const reportSnap = await getDoc(reportRef);
            if (reportSnap.exists()) {
              const reportData = reportSnap.data();
              if (reportData.status === 'Rejected') {
                alert(`Your content was rejected. Reason: ${reportData.rejectReason}`);
              } else if (reportData.status === 'Approved') {
                alert('Your content was approved.');
              }
            }
          } else {
            console.log("No profile found!");
          }
          setIsProfileLoaded(true); // Mark profile as loaded
        } catch (error) {
          console.error("Error fetching profile or report:", error);
        }
      }
    };
    fetchProfile();
  }, [user, db]);

  if (!isProfileLoaded) {
    return <div>Loading...</div>;
  }

  // Only render Nav and Routes when profile is loaded to avoid flashing the wrong UI state
  if (!isProfileLoaded) {
    return <div>Loading...</div>; // Or add a better loading spinner here
  }

  return (
    <Router>
      <Switch>
        {/* Route for Content Moderation with user and isAdmin props passed */}
        <Route
          path="/ContentModeration"
          render={() => (
            <ModerationDashboard user={user} isAdmin={isAdmin} />
          )}
        />

        {/* General Application Routes */}
        <Route>
          <Nav />
          <Layout>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/explore" component={Explore} />
              <Route exact path="/notifications" component={Notifications} />
              <Route exact path="/bookmarks" component={Bookmarks} />
              <Route exact path="/settings/profile" component={EditProfile} />
              <Route exact path="/:handle/status/:quickieId" component={MasterQuickie} />
              <Route exact path="/:handle" component={Profile} />
              <Redirect from="*" to="/" />
            </Switch>
            <Suggestion />
          </Layout>
        </Route>
      </Switch>
    </Router>
  );
};

export default AppRouter;
