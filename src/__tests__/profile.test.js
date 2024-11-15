// App.test.js

import { App } from '/Users/miafelipe/Desktop/coding/RIVAL/app.js';
describe('App', () => {
  let app, user1, user2, post, comment, notification;

  beforeEach(() => {
    app = new App();
    user1 = app.signUp('user1@example.com', 'password1');
    user2 = app.signUp('user2@example.com', 'password2');
    post = app.createPost(user1, 'A post to interact with');
    comment = app.commentOnPost(post, 'A comment to interact with');
    notification = { message: 'New follower', read: false };
    user1.notifications = [notification];
  });

  // Existing tests...

  test('Follow a user', () => {
    const following = app.followUser(user1, user2);
    expect(following).toContain(user2);
  });

  test('Unfollow a user', () => {
    app.followUser(user1, user2);
    const following = app.unfollowUser(user1, user2);
    expect(following).not.toContain(user2);
  });

  test('Add reaction to a comment', () => {
    const reactions = app.addReactionToComment(comment, 'like');
    expect(reactions['like']).toBe(1);
  });

  test('Delete reaction from a comment', () => {
    app.addReactionToComment(comment, 'like');
    const reactions = app.deleteReactionFromComment(comment, 'like');
    expect(reactions['like']).toBeUndefined();
  });

  test('Mark a notification as read', () => {
    app.markNotificationAsRead(user1, notification);
    expect(notification.read).toBe(true);
  });

  test('Delete a notification', () => {
    const notifications = app.deleteNotification(user1, notification);
    expect(notifications).not.toContain(notification);
  });

  test('Mute a user', () => {
    const mutedUsers = app.muteUser(user1, user2);
    expect(mutedUsers).toContain(user2);
  });

  test('Unmute a user', () => {
    app.muteUser(user1, user2);
    const mutedUsers = app.unmuteUser(user1, user2);
    expect(mutedUsers).not.toContain(user2);
  });

  test('Edit a post', () => {
    const newContent = 'Updated post content';
    const editedContent = app.editPost(post, newContent);
    expect(editedContent).toBe(newContent);
  });

  test('Delete a post', () => {
    user1.posts = [post];
    const posts = app.deletePost(user1, post);
    expect(posts).not.toContain(post);
  });

  test('Report a post', () => {
    const reports = app.reportPost(post, 'Spam');
    expect(reports).toContain('Spam');
  });

  test('Block a user', () => {
    const blockedUsers = app.blockUser(user1, user2);
    expect(blockedUsers).toContain(user2);
  });

  test('Unblock a user', () => {
    app.blockUser(user1, user2);
    const blockedUsers = app.unblockUser(user1, user2);
    expect(blockedUsers).not.toContain(user2);
  });
});
