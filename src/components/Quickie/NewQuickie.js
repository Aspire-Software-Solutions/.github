import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import TextareaAutosize from "react-textarea-autosize";
import useInput from "../../hooks/useInput";
import Button from "../../styles/Button";
import QuickieFile from "../../styles/QuickieFile";
import { UploadFileIcon, CloseIcon } from "../Icons"; // Import CloseIcon
import { displayError } from "../../utils";
import Avatar from "../../styles/Avatar";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"; // Firestore
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage
import { getAuth } from "firebase/auth"; // Firebase Authentication

const defaultAvatarUrl = "/default-avatar.png";

const Wrapper = styled.div`
  display: flex;
  padding: 1rem 1rem;
  border-bottom: 7px solid ${(props) => props.theme.tertiaryColor};

  textarea {
    width: 100%;
    background: inherit;
    border: none;
    font-size: 1.23rem;
    font-family: ${(props) => props.theme.font};
    color: ${(props) => props.theme.primaryColor};
    margin-bottom: 1.4rem;
  }

  .new-quickie {
    display: flex;
    flex-direction: column;
  }

  .new-quickie-action {
    display: flex;
    align-items: center;
  }

  svg {
    width: 24px;
    height: 24px;
    fill: ${(props) => props.theme.accentColor};
    margin-right: 2rem;
    cursor: pointer;
  }

  button {
    position: relative;
  }
`;

const QuickieFileWrapper = styled.div`
  position: relative;
  display: inline-block;

  .close-icon {
    position: absolute;
    top: 5px;
    right: 5px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 2;
  }
`;

const NewQuickie = () => {
  const [mediaUrl, setMediaUrl] = useState(null); // Store file preview locally
  const [mediaFile, setMediaFile] = useState(null); // Store file locally
  const [userAvatar, setUserAvatar] = useState(defaultAvatarUrl); // State to track user avatar
  const quickie = useInput("");
  const db = getFirestore(); // Firestore instance
  const auth = getAuth(); // Firebase Auth instance
  const storage = getStorage(); // Firebase Storage instance

  // Fetch the user avatar from Firestore on component mount
  useEffect(() => {
    const fetchUserAvatar = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "profiles", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserAvatar(userData.avatarUrl || defaultAvatarUrl); // Ensure avatarUrl is used
        }
      }
    };
    fetchUserAvatar();
  }, [auth, db]);

  const handleNewQuickie = async (e) => {
    e.preventDefault();

    if (!quickie.value) {
      return toast("Write something");
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to post a quickie.");
        return;
      }

      // Upload media file if one was selected
      let uploadedMediaUrl = null;
      if (mediaFile) {
        const fileType = mediaFile.type.split("/")[0]; // Check if it's an image or video
        const storageRef = ref(storage, `quickies/${mediaFile.name}`); // Create a storage reference

        if (fileType === "video") {
          const video = document.createElement("video");
          video.src = URL.createObjectURL(mediaFile);

          // Wait for the video metadata to load before checking the duration
          video.onloadedmetadata = async function () {
            const duration = video.duration;
            window.URL.revokeObjectURL(video.src);

            if (duration > 30) {
              toast.error("Video must be less than 30 seconds");
              return;
            }

            // Proceed with video upload
            const uploadTask = uploadBytesResumable(storageRef, mediaFile);
            await new Promise((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                null, // Progress handler
                (error) => {
                  toast.error("Failed to upload video");
                  reject(error);
                },
                async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  uploadedMediaUrl = downloadURL;
                  resolve(downloadURL);
                }
              );
            });

            // After video upload, create the quickie
            await addQuickieToFirestore(uploadedMediaUrl, user);
          };
        } else {
          // Handle image upload
          const uploadTask = uploadBytesResumable(storageRef, mediaFile);
          await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null, // Progress handler
              (error) => {
                toast.error("Failed to upload image");
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                uploadedMediaUrl = downloadURL;
                resolve(downloadURL);
              }
            );
          });

          // Add the quickie after image upload
          await addQuickieToFirestore(uploadedMediaUrl, user);
        }
      } else {
        // If no media file, just add the text-only quickie
        await addQuickieToFirestore(null, user);
      }
    } catch (err) {
      displayError(err);
    }

    quickie.setValue("");
    setMediaUrl(null);
    setMediaFile(null);
  };

  const tags = quickie.value.split(" ").filter((str) => str.startsWith("#"));


  // Helper function to add quickie to Firestore
  const addQuickieToFirestore = async (mediaUrl, user) => {
    // Fetch the user's handle from the profiles collection
    const userRef = doc(db, "profiles", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      toast.error("User profile not found.");
      return;
    }

    const { handle } = userSnap.data(); // Get the user's handle

    const newQuickieData = {
      text: quickie.value,
      tags,
      mediaUrl: mediaUrl || null, // Store mediaUrl if available
      userId: user.uid,
      handle, // Add the handle from the profiles collection
      userAvatar: userAvatar || defaultAvatarUrl, // Use avatarUrl from Firestore
      createdAt: serverTimestamp(),
      likes: [],
      userName: user.displayName,
      likesCount: 0,
      comments: [],
      commentsCount: 0,
    };

    // Add the new quickie to Firestore
    await addDoc(collection(db, "quickies"), newQuickieData);

    toast.success("Your attack has been sent!");
  };

  const handleQuickieFiles = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split("/")[0]; // Check if it's an image or video
    if (fileType === "video") {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);

      video.onloadedmetadata = function () {
        const duration = video.duration;
        if (duration > 30) {
          toast.error("Video must be less than 30 seconds long.");
          return;
        }
        setMediaFile(file);
        setMediaUrl(URL.createObjectURL(file)); // Display video preview
      };
    } else {
      // Handle image preview
      setMediaFile(file); // Save the file locally
      setMediaUrl(URL.createObjectURL(file)); // Display a local preview
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaUrl(null); // Clear the preview and the file
  };

  return (
    <Wrapper>
      <Avatar src={userAvatar || defaultAvatarUrl} alt="avatar" /> {/* Use Firestore Avatar */}
      <form onSubmit={handleNewQuickie}>
        <div className="new-quickie">
          <TextareaAutosize
            cols="48"
            placeholder="Launch an attack!"
            type="text"
            value={quickie.value}
            onChange={quickie.onChange}
          />

          {mediaUrl && (
            <QuickieFileWrapper>
              {mediaFile.type.startsWith("video") ? (
                <video controls src={mediaUrl} width="100%" />
              ) : (
                <QuickieFile newquickie src={mediaUrl} alt="preview" />
              )}
              <div className="close-icon" onClick={handleRemoveMedia}>
                <CloseIcon />
              </div>
            </QuickieFileWrapper>
          )}

          <div className="new-quickie-action">
            <div className="svg-input">
              <label htmlFor="file-input">
                <UploadFileIcon />
              </label>
              <input
                id="file-input"
                accept="image/*, video/*" // Allow both image and video uploads
                type="file"
                onChange={handleQuickieFiles}
              />
            </div>
            <Button sm disabled={!quickie.value}>
              Attack
            </Button>
          </div>
        </div>
      </form>
    </Wrapper>
  );
};

export default NewQuickie;
