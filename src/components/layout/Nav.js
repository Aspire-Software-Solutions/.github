import styled from "styled-components";
import { NavLink, useHistory, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  ExploreIcon,
  NotificationIcon,
  ChatIcon,
  BackIcon,
  AdminIcon,
  HamburgerIcon
} from "../Icons";
import ToggleTheme from "../ToggleTheme";

const Wrapper = styled.nav`
  height: 4rem;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4); /* Soft shadow under navbar */
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  width: 100%;
  z-index: 2;
  background-color: #720000; /* Set a fixed navbar color */

  .nav-center {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    gap: 11rem; /* Adjust spacing between icons in the center */
    /*padding-left: rem; used to be 5 rem */
  }

  .nav-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1.5rem; /* Adjust spacing between notification, chat, and profile icons */
  }


  .menu-toggle {
    display: none;
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
  }

  .nav-dropdown {
    display: none; /* Hidden on larger screens */
  }



  @media (max-width: 750px) {
      .nav-center,
      .nav-right
      {
        display: none;
      }

      .profile-menu{
        display: block;
      }

      .navdropdown {
        display: flex;
        flex-direction: column; /* Stack icons vertically */
        align-items: flex-start; /* Align icons to the left */
        gap: 1.5rem; /* Space between icons */
        padding: 1rem;
        width: 50%; /* Full width for better spacing */
      }

      .nav-dropdown {
        display: block; /* Hidden on larger screens */
        left:0;
      }


      .dropdown {
        display: block;
        flex-direction: column; /* Stack icons vertically */
        align-items: flex-start; /* Align icons to the left */
        gap: 1rem; /* Space between icons */
      }
  }

  .profile-menu {
    position: relative;
    display: block;
    align-items: center;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 100%;
    cursor: pointer;
    transition: transform 0.3s ease;
    background-color: white; /* Ensures profile avatar has a white circle background */
    /*padding: 7px;  Space around the avatar image */
  }

  .profile-avatar img {
    border-radius: 50%;
    width: 100%;
    height: 100%;
  }

  .profile-avatar:hover {
    transform: scale(1.1);
  }

  .dropdown {
    position: absolute;
    top: 130%;
    right: 0;
    background: ${(props) => props.theme.background};
    border: 1px solid ${(props) => props.theme.tertiaryColor};
    padding: 0.5rem 1rem;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 5;
  }

  .dropdown a,
  .dropdown button {
    margin-bottom: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
    color: ${(props) => props.theme.primaryColor};
  }

  .dropdown button:hover,
  .dropdown a:hover {
    color: ${(props) => props.theme.accentColor};
  }

  ul {
    display: flex;
    justify-content: space-around;
    width: 100%;
  }

  li {
    margin-right: 1.5rem;
  }

  svg {
    width: 32px;
    height: 32px;
    cursor: pointer;
    transition: transform 0.3s ease, fill 0.3s ease,
      stroke 0.3s ease; /* Smooth transition for fill and stroke */
    fill: white;
  }

  svg:hover {
    transform: scale(1.1);
    fill: ${(props) => props.theme.accentColor}; /* For filled icons */
    stroke: ${(props) => props.theme.accentColor}; /* For outline icons */
  }

  .navdropdown{
    position: absolute;
    top: 100%;
    left: 0;
    background: ${(props) => props.theme.background};
    border: 1px solid ${(props) => props.theme.tertiaryColor};
    padding: 0.5rem 1rem;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 5;
  
  
  }

  



  .navdropdown a,
  .navdropdown button {
    margin-bottom: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
    color: ${(props) => props.theme.primaryColor};
  }

  .navdropdown button:hover,
  .navdropdown a:hover {
    color: ${(props) => props.theme.accentColor};
  }

  .hamburger {
  cursor: pointer;
  transition: color 0.3s ease; /* Smooth color transition */
  }

  .hamburger:hover {
    transform: scale(1.1);
    color: #ff000d; /* Change to your desired hover color */
  }
    

  


  


  

`;







// Style for the notification count badge
const badgeStyle = {
  position: "absolute",
  top: "-5px",
  right: "-10px",
  backgroundColor: "red",
  color: "white",
  borderRadius: "50%",
  padding: "3px 6px",
  fontSize: "12px",
  fontWeight: "bold",
};

const Nav = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [handle, setHandle] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Count of unread notifications
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0); // NEW: Count of conversations with unread messages
  const [userAvatar, setUserAvatar] = useState("/default-avatar.png");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status
  const dropdownRef = useRef(null);
  const db = getFirestore();
  const history = useHistory(); // To use history and navigate back
  const location = useLocation(); // To get the current route
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Check if the current route should show a back button
  const showBackButton =
    location.pathname.includes("/followers") ||
    location.pathname.includes("/following") ||
    location.pathname.includes("/status") ||
    location.pathname.includes("/conversations/");

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setHandle(profileData.handle);
          setUserAvatar(profileData.avatarUrl || "/default-avatar.png");
          setIsAdmin(profileData.isAdmin || false); // Check if the user is an admin
        }
      }
    };
    fetchProfile();
  }, [user, db]);

  // Function to update unread notification count
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", user.uid),
      where("isRead", "==", false) // Only unread notifications
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size); // Update unreadCount state in real-time
    });

    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [db, user]);

  // NEW: Fetch unread conversations count
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("members", "array-contains", user.uid)
    );

    // Listen for real-time updates on conversations
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const lastMessageTimestamp = data.lastMessageTimestamp;
        const lastRead = data.lastRead ? data.lastRead[user.uid] : null;

        if (lastMessageTimestamp) {
          // Compare lastMessageTimestamp with lastRead[user.uid]
          if (
            !lastRead ||
            lastRead.toMillis() < lastMessageTimestamp.toMillis()
          ) {
            count += 1;
          }
        }
      });

      setUnreadConversationsCount(count); // Update the state with the count
    });

    return () => unsubscribe();
  }, [db, user]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  




  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Wrapper>
      {/* Conditionally render the back button */}
      {showBackButton && (
        <div onClick={() => history.goBack()} style={{ cursor: "pointer" , position: "absolute", left: "4rem" }}>
          <BackIcon />
        </div>
      )}

      <div className = "nav-dropdown">
        <li className="hamburger" onClick={toggleSidebar}>
          <HamburgerIcon /> {/* Dropdown icon as equals sign */}
        </li>
        {isSidebarOpen && (
            <div className="navdropdown" ref={dropdownRef} style={{margin: ".1rem"}}>
              <NavLink exact activeClassName="selected" to="/" onClick={() => setSidebarOpen(false)}>
                <HomeIcon />
                <span>HOME</span>
              </NavLink>
              <NavLink activeClassName="selected" to="/explore" onClick={() => setSidebarOpen(false)}>
                <ExploreIcon />
                <span>EXPLORE</span>
              </NavLink>
              <NavLink activeClassName="selected" to="/notifications" onClick={() => setSidebarOpen(false)}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ position: "relative"}}>
                  <NotificationIcon />
                  {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
                  </div>
                  <span style={{ paddingLeft: unreadConversationsCount > 0 ? "20px" : "0" }}>MESSAGES</span>
                </div>
              </NavLink>
              <NavLink activeClassName="selected" to="/conversations" onClick={() => setSidebarOpen(false)}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <ChatIcon />
                  {unreadConversationsCount > 0 && (
                    <span style={{ ...badgeStyle}}>{unreadConversationsCount}</span>
                  )}
                </div>
                <span style={{ paddingLeft: unreadConversationsCount > 0 ? "20px" : "0" }}>MESSAGES</span>
              </div>
            </NavLink>                        
          </div>
        )}
      </div>

      <div className="nav-center">
        <li>
          <NavLink exact activeClassName="selected" to="/">
            <HomeIcon />
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="selected" to="/explore">
            <ExploreIcon />
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink activeClassName="selected" to="/ContentModeration">
              <AdminIcon /> {/* Use any icon you want here */}
            </NavLink>
          </li>
        )}
      </div>

    

      <div className="nav-right">
        <NavLink activeClassName="selected" to="/notifications">
          <div style={{ position: "relative" }}>
            <NotificationIcon />
            {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
          </div>
        </NavLink>

        <NavLink activeClassName="selected" to="/conversations">
          <div style={{ position: "relative" }}>
            <ChatIcon />
            {unreadConversationsCount > 0 && (
              <span style={badgeStyle}>{unreadConversationsCount}</span>
            )}
          </div>
        </NavLink>

        
        {/*<div className="profile-menu">
          <div className="profile-avatar" onClick={toggleDropdown}>
            <img src={userAvatar} alt="Profile" />
          </div>
          {isDropdownOpen && (
            <div className="dropdown" ref={dropdownRef}>
              <NavLink to={`/${handle}`}>Profile</NavLink>
              <NavLink to="/bookmarks">Bookmarks</NavLink>

              <ToggleTheme /> {/* Inserted theme toggle component */}
              {/*<button onClick={() => auth.signOut()}>Logout</button>
            </div>
          )}
        </div>*/}
        
      </div>
      

      <div className="profile-menu">
          <div className="profile-avatar" style={{marginLeft: "25px"}} onClick={toggleDropdown}>
            <img src={userAvatar} alt="Profile" />
          </div>
          {isDropdownOpen && (
            <div className="dropdown" ref={dropdownRef}>
              <NavLink to={`/${handle}`} onClick={() => setIsDropdownOpen(false)}>Profile</NavLink>
              <NavLink to="/bookmarks"onClick={() => setIsDropdownOpen(false)}>Bookmarks</NavLink>
              <ToggleTheme /> {/* Inserted theme toggle component */}
              <button onClick={() => auth.signOut()}>Logout</button>
            </div>
          )}
        </div>
    </Wrapper>
  );
};

export default Nav;