import { toast } from "react-toastify";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage imports
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"; // Firebase Firestore imports

export const displayError = (err) => {
  const message = err?.message?.split(":")[1]?.trim() || "An error occurred";
  toast.error(message.replace(".", ""));
};

export const sortFn = (a, b) => {
  var dateA = new Date(a.createdAt).getTime();
  var dateB = new Date(b.createdAt).getTime();
  return dateA < dateB ? 1 : -1;
};

export const uploadImage = async (file) => {
  const storage = getStorage();
  const storageRef = ref(storage, `images/${file.name}`);
  let toastId = null;

  try {
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;

          if (toastId === null) {
            toastId = toast("Upload in progress", {
              progress,
              bodyClassName: "upload-progress-bar",
            });
          } else {
            toast.update(toastId, {
              progress,
            });
          }
        },
        (error) => {
          toast.dismiss(toastId);
          displayError(error);
          reject(error);
        },
        async () => {
          toast.dismiss(toastId);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    displayError(error);
    throw error;
  }
};

// New Function to update avatar everywhere
export const updateAvatarEverywhere = async (userId, newAvatarUrl) => {
  const db = getFirestore();

  try {
    // Update avatar in 'quickies' collection
    const quickiesRef = collection(db, "quickies");
    const quickiesQuery = query(quickiesRef, where("userId", "==", userId));
    const quickiesSnapshot = await getDocs(quickiesQuery);

    quickiesSnapshot.forEach(async (quickieDoc) => {
      const quickieRef = doc(db, "quickies", quickieDoc.id);
      await updateDoc(quickieRef, {
        userAvatar: newAvatarUrl,
      });
    });

    // Update avatar in 'comments' of all quickies
    const quickiesWithCommentsQuery = query(quickiesRef);
    const quickiesWithCommentsSnapshot = await getDocs(quickiesWithCommentsQuery);

    quickiesWithCommentsSnapshot.forEach(async (quickieDoc) => {
      const quickieRef = doc(db, "quickies", quickieDoc.id);
      const quickieData = quickieDoc.data();

      if (quickieData.comments) {
        const updatedComments = quickieData.comments.map((comment) =>
          comment.userId === userId ? { ...comment, userAvatar: newAvatarUrl } : comment
        );

        await updateDoc(quickieRef, {
          comments: updatedComments,
        });
      }
    });

    console.log("Profile picture updated everywhere.");
  } catch (error) {
    console.error("Error updating avatar everywhere: ", error);
  }
};
