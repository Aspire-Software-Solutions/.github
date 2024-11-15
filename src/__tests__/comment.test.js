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

  test('Like a comment', () => {
    const likes = app.likeComment(post, comment);
    expect(likes).toBe(1);
  });

  test('Pin a post', () => {
    const pinnedPost = app.pinPost(user1, post);
    expect(pinnedPost).toBe(post);
  });

  test('Unpin a post', () => {
    app.pinPost(user1, post);
    const unpinnedPost = app.unpinPost(user1);
    expect(unpinnedPost).toBeNull();
  });

  test('Send a friend request', () => {
    const friendRequests = app.sendFriendRequest(user1, user2);
    expect(friendRequests).toContain(user1);
  });

});
