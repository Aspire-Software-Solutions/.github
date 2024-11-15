export const mockUser = {
    uid: "mockUserId",
    displayName: "Test User",
    email: "testuser@example.com",
    photoURL: "https://example.com/photo.jpg"
};

export const mockAuthStateChanged = (callback) => {
   callback(mockUser)
};

export const mockFollowerData = {
    currentUserUd: {
        uid: "mockUserId",
        followers: ["user1", "user2"],
            followersCount: 2
    }
};

export const mockPost = {
    postId: "mockPostId",
    content: "This is a mock post.",
    authorId: "mockUserId",
    likes: 5,
    comments: [],
  };

