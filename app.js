// App.js

export class User {
    constructor(email, password) {
      this.email = email;
      this.password = password;
      this.profile = { bio: '', avatar: '', visibility: 'public' };
    }
  }
  
  export class App {
    constructor() {
      this.users = [];
      this.posts = [];
    }
  
    signUp(email, password) {
      const user = new User(email, password);
      this.users.push(user);
      return user;
    }
  
    login(email, password) {
      const user = this.users.find((u) => u.email === email && u.password === password);
      return user ? { success: true, user } : { success: false, message: 'Invalid credentials' };
    }
  
    updateProfile(user, bio, avatar) {
      user.profile.bio = bio;
      user.profile.avatar = avatar;
      return user.profile;
    }
  
    follow(user, targetUser) {
      user.following = user.following || [];
      if (!user.following.includes(targetUser)) {
        user.following.push(targetUser);
      }
      return user.following;
    }
  
    createPost(user, content) {
      const post = { user, content, likes: 0, comments: [] };
      this.posts.push(post);
      return post;
    }
  
    likePost(post) {
      post.likes += 1;
      return post.likes;
    }
  
    commentOnPost(post, comment) {
      post.comments.push(comment);
      return post.comments;
    }
  
    deletePost(post) {
      this.posts = this.posts.filter((p) => p !== post);
      return this.posts;
    }
    unfollow(user, targetUser) {
      user.following = user.following || [];
      user.following = user.following.filter((u) => u !== targetUser);
      return user.following;
    }
  
    viewProfile(user) {
      return user.profile;
    }
  
    toggleNotifications(user) {
      user.profile.notifications = !user.profile.notifications;
      return user.profile.notifications;
    }
  
    blockUser(user, targetUser) {
      return true;
    }
  
    resetPassword(user, newPassword) {
      user.password = newPassword;
      return user.password;
    }
  
    deleteComment(post, comment) {
      post.comments = post.comments.filter((c) => c !== comment);
      return post.comments;
    }
  
    updatePrivacy(user, visibility) {
      user.profile.visibility = visibility;
      return user.profile.visibility;
    }
  
    reportPost(post) {
      post.reported = true;
      return post.reported;
    }
  
    muteUser(user, targetUser) {
      user.mutedUsers = user.mutedUsers || [];
      if (!user.mutedUsers.includes(targetUser)) {
        user.mutedUsers.push(targetUser);
      }
      return user.mutedUsers;
    }
  
    markPostAsFavorite(user, post) {
      user.favorites = user.favorites || [];
      user.favorites.push(post);
      return user.favorites;
    }
  
    removeFavorite(user, post) {
      user.favorites = user.favorites.filter((p) => p !== post);
      return user.favorites;
    }
  
    archivePost(post) {
      post.archived = true;
      return post.archived;
    }
  
    reactivatePost(post) {
      post.archived = false;
      return post.archived;
    }

    likeComment(post, comment) {
      comment.likes = (comment.likes || 0) + 1;
      return comment.likes;
    }
  
    pinPost(user, post) {
      user.pinnedPost = post;
      return user.pinnedPost;
    }
  
    unpinPost(user) {
      user.pinnedPost = null;
      return user.pinnedPost;
    }
  
    sendFriendRequest(user, targetUser) {
      targetUser.friendRequests = targetUser.friendRequests || [];
      targetUser.friendRequests.push(user);
      return targetUser.friendRequests;
    }
  
    acceptFriendRequest(user, requester) {
      user.friends = user.friends || [];
      user.friends.push(requester);
      user.friendRequests = user.friendRequests.filter((req) => req !== requester);
      return user.friends;
    }
  
    rejectFriendRequest(user, requester) {
      user.friendRequests = user.friendRequests.filter((req) => req !== requester);
      return user.friendRequests;
    }
  
    tagUserInPost(post, user) {
      post.tags = post.tags || [];
      post.tags.push(user);
      return post.tags;
    }
  
    removeUserTag(post, user) {
      post.tags = post.tags.filter((u) => u !== user);
      return post.tags;
    }
  
    bookmarkPost(user, post) {
      user.bookmarks = user.bookmarks || [];
      user.bookmarks.push(post);
      return user.bookmarks;
    }
  
    removeBookmark(user, post) {
      user.bookmarks = user.bookmarks.filter((p) => p !== post);
      return user.bookmarks;
    }
  
    hidePost(user, post) {
      user.hiddenPosts = user.hiddenPosts || [];
      user.hiddenPosts.push(post);
      return user.hiddenPosts;
    }
  
    unhidePost(user, post) {
      user.hiddenPosts = user.hiddenPosts.filter((p) => p !== post);
      return user.hiddenPosts;
    }
  
    sharePost(post, platform) {
      post.shares = post.shares || {};
      post.shares[platform] = (post.shares[platform] || 0) + 1;
      return post.shares;
    }
  
    reactToPost(post, reaction) {
      post.reactions = post.reactions || {};
      post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
      return post.reactions;
    }
  
    editComment(post, comment, newContent) {
      comment.content = newContent;
      return comment.content;
    }
    followUser(user, targetUser) {
      user.following = user.following || [];
      if (!user.following.includes(targetUser)) {
        user.following.push(targetUser);
      }
      return user.following;
    }
  
    unfollowUser(user, targetUser) {
      user.following = user.following || [];
      user.following = user.following.filter((u) => u !== targetUser);
      return user.following;
    }
  
    addReactionToComment(comment, reaction) {
      comment.reactions = comment.reactions || {};
      comment.reactions[reaction] = (comment.reactions[reaction] || 0) + 1;
      return comment.reactions;
    }
  
    deleteReactionFromComment(comment, reaction) {
      if (comment.reactions && comment.reactions[reaction]) {
        comment.reactions[reaction]--;
        if (comment.reactions[reaction] <= 0) {
          delete comment.reactions[reaction];
        }
      }
      return comment.reactions || {};
    }
  
    markNotificationAsRead(user, notification) {
      user.notifications = user.notifications || [];
      notification.read = true;
      return user.notifications;
    }
  
    deleteNotification(user, notification) {
      user.notifications = user.notifications.filter((n) => n !== notification);
      return user.notifications;
    }
  
    muteUser(user, targetUser) {
      user.mutedUsers = user.mutedUsers || [];
      if (!user.mutedUsers.includes(targetUser)) {
        user.mutedUsers.push(targetUser);
      }
      return user.mutedUsers;
    }
  
    unmuteUser(user, targetUser) {
      user.mutedUsers = user.mutedUsers || [];
      user.mutedUsers = user.mutedUsers.filter((u) => u !== targetUser);
      return user.mutedUsers;
    }
  
    editPost(post, newContent) {
      post.content = newContent;
      return post.content;
    }
  
    deletePost(user, post) {
      user.posts = user.posts || [];
      user.posts = user.posts.filter((p) => p !== post);
      return true;
    }
  
    reportPost(post, reason) {
      post.reports = post.reports || [];
      post.reports.push(reason);
      return post.reports;
    }
  
    blockUser(user, targetUser) {
      user.blockedUsers = user.blockedUsers || [];
      user.blockedUsers.push(targetUser);
      return user.blockedUsers;
    }
  
    unblockUser(user, targetUser) {
      user.blockedUsers = user.blockedUsers || [];
      user.blockedUsers = user.blockedUsers.filter((u) => u !== targetUser);
      return user.blockedUsers;
    }
  }
  
  
  
  