import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import Layout from "./styles/Layout";
import Nav from "./components/layout/Nav";
import Home from "./pages/Home";
import MasterQuickie from "./components/Quickie/MasterQuickie"; // Renamed for consistency
import Profile from "./components/Profile/Profile";
import Bookmarks from "./pages/Bookmarks";
import Notifications from "./pages/Notifications";
import Explore from "./pages/Explore";
import EditProfile from "./components/Profile/EditProfile";
import FollowersFollowing from "./components/Profile/FollowersFollowing";
import ConversationsList from "./components/Conversations/ConversationsList";
import ConversationDetail from "./components/Conversations/ConversationDetail";

const AppRouter = () => {
  return (
    <Router>
      <Nav />
      <Layout>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/explore" component={Explore} />
          <Route exact path="/notifications" component={Notifications} />
          <Route exact path="/bookmarks" component={Bookmarks} />
          <Route exact path="/conversations" component={ConversationsList} />
          <Route exact path="/conversations/:conversationId" component={ConversationDetail} />
          <Route
            exact path={`/:handle/status/:quickieId`} // Renamed for consistency
            component={MasterQuickie} // Renamed for consistency
          />
          <Route exact path={`/settings/profile`} component={EditProfile} />
          <Route exact path={`/:handle`} component={Profile} />
          <Route exact path={`/:handle/:type`} component={FollowersFollowing} />
          <Redirect from="*" to="/" />
        </Switch>
      </Layout>
    </Router>
  );
};

export default AppRouter;
