import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import TextareaAutosize from "react-textarea-autosize";
import useInput from "../../hooks/useInput";
import Button from "../../styles/Button";
import QuickieFile from "../../styles/QuickieFile";
import { UploadFileIcon, CloseIcon } from "../Icons";
import { displayError } from "../../utils";
import Avatar from "../../styles/Avatar";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getDatabase, ref as rtdbRef, onValue } from "firebase/database";
import { usePresence } from "../Auth/Presence";
import { useStatus } from "../Auth/StatusProvider";

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

const PRESENCE_TIMEOUT = 2 * 60 * 1000;

const NewQuickie = () => {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [userAvatar, setUserAvatar] = useState(defaultAvatarUrl);
  const [userStatus, setUserStatus] = useState({ isActive: false });
  const quickie = useInput("");
  const { showActiveStatus } = useStatus();
  const db = getFirestore();
  const auth = getAuth();
  const storage = getStorage();
  const rtdb = getDatabase();
  const user = auth.currentUser;

  const isUserActive = (lastChanged) => {
    if (!lastChanged) return false;
    const lastChangedTime = new Date(lastChanged).getTime();
    return Date.now() - lastChangedTime < PRESENCE_TIMEOUT;
  };

  // Set up real-time status listener
  useEffect(() => {
    if (!user) return;

    const statusRef = rtdbRef(rtdb, `/status/${user.uid}`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserStatus({
          isActive: data.state === 'online',
          lastChanged: data.last_changed
        });
      } else {
        setUserStatus({ isActive: false });
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser, rtdb]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "profiles", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserAvatar(userData.avatarUrl || defaultAvatarUrl);
        }
      }
    };
    fetchUserDetails();
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

      let uploadedMediaUrl = null;
      if (mediaFile) {
        const fileType = mediaFile.type.split("/")[0];
        const fileRef = storageRef(storage, `quickies/${mediaFile.name}`);

        if (fileType === "video") {
          const video = document.createElement("video");
          video.src = URL.createObjectURL(mediaFile);

          video.onloadedmetadata = async function () {
            const duration = video.duration;
            window.URL.revokeObjectURL(video.src);

            if (duration > 30) {
              toast.error("Video must be less than 30 seconds");
              return;
            }

            const uploadTask = uploadBytesResumable(fileRef, mediaFile);
            await new Promise((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                null,
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

            await addQuickieToFirestore(uploadedMediaUrl, user);
          };
        } else {
          const uploadTask = uploadBytesResumable(fileRef, mediaFile);
          await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
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

          await addQuickieToFirestore(uploadedMediaUrl, user);
        }
      } else {
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

  const addQuickieToFirestore = async (mediaUrl, user) => {
    const userRef = doc(db, "profiles", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      toast.error("User profile not found.");
      return;
    }

    const { handle } = userSnap.data();

    const newQuickieData = {
      text: quickie.value,
      tags,
      mediaUrl: mediaUrl || null,
      userId: user.uid,
      handle,
      userAvatar: userAvatar || defaultAvatarUrl,
      createdAt: serverTimestamp(),
      likes: [],
      userName: user.displayName,
      likesCount: 0,
      comments: [],
      commentsCount: 0,
    };

    await addDoc(collection(db, "quickies"), newQuickieData);
    toast.success("Your attack has been sent!");
  };

  const handleQuickieFiles = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split("/")[0];
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
        setMediaUrl(URL.createObjectURL(file));
      };
    } else {
      setMediaFile(file);
      setMediaUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaUrl(null);
  };

  return (
    <Wrapper>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Avatar 
          src={userAvatar || defaultAvatarUrl} 
          alt="avatar"
          showStatus={user.showActiveStatus}
          isActive={userStatus}
        />
      </div>
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
                accept="image/*, video/*"
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