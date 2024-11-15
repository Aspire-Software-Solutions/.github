// App.test.js

import { App } from '/Users/miafelipe/Desktop/coding/RIVAL/app.js';

describe('App', () => {
  let app, user1, user2, post, comment;

  beforeEach(() => {
    app = new App();
    user1 = app.signUp('user1@example.com', 'password1');
    user2 = app.signUp('user2@example.com', 'password2');
    post = app.createPost(user1, 'A post to interact with');
    comment = app.commentOnPost(post, 'A comment to like and edit');
  });

  test('Accept a friend request', () => {
    app.sendFriendRequest(user1, user2);
    const friends = app.acceptFriendRequest(user2, user1);
    expect(friends).toContain(user1);
    expect(user2.friendRequests).not.toContain(user1);
  });

  test('Reject a friend request', () => {
    app.sendFriendRequest(user1, user2);
    const friendRequests = app.rejectFriendRequest(user2, user1);
    expect(friendRequests).not.toContain(user1);
  });

  test('Tag a user in a post', () => {
    const tags = app.tagUserInPost(post, user2);
    expect(tags).toContain(user2);
  });
  test('Check blocked users', () => {
    app.blockUser(user1, user2);
  });

  test('Remove a user tag from a post', () => {
    app.tagUserInPost(post, user2);
    const tags = app.removeUserTag(post, user2);
    expect(tags).not.toContain(user2);
  });

  test('Bookmark a post', () => {
    const bookmarks = app.bookmarkPost(user1, post);
    expect(bookmarks).toContain(post);
  });

  test('Remove a bookmark', () => {
    app.bookmarkPost(user1, post);
    const bookmarks = app.removeBookmark(user1, post);
    expect(bookmarks).not.toContain(post);
  });

  test('Hide a post', () => {
    const hiddenPosts = app.hidePost(user1, post);
    expect(hiddenPosts).toContain(post);
  });
});
