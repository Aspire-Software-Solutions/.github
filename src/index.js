import React from "react";
import { render } from "react-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { initializeApp } from "firebase/app"; // Import Firebase App

// Your Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyA2Uf5nXzvN5aSRL0iaOepYxOW6m7e2yjM",
  authDomain: "fbproject-c27b4.firebaseapp.com",
  databaseURL: "https://fbproject-c27b4-default-rtdb.firebaseio.com",
  projectId: "fbproject-c27b4",
  storageBucket: "fbproject-c27b4.appspot.com",
  messagingSenderId: "1008151670205",
  appId: "1:1008151670205:web:231a4bf7573ccd5a7ef6d4",
  measurementId: "G-VXYKQYFG9G"
};

// Initialize Firebase
initializeApp(firebaseConfig);

const RootApp = () => (
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

render(<RootApp />, document.getElementById("root"));
