// App.test.js

import { App } from '/Users/miafelipe/Desktop/coding/RIVAL/app.js';

describe('App', () => {
  let app, user1, user2, post;

  beforeEach(() => {
    app = new App();
    user1 = app.signUp('user1@example.com', 'password1');
    user2 = app.signUp('user2@example.com', 'password2');
  });

  test('Unfollow a user', () => {
    app.follow(user1, user2);
    const following = app.unfollow(user1, user2);
    expect(following).not.toContain(user2);
  });

  test('View profile', () => {
    const profile = app.viewProfile(user1);
    expect(profile).toBe(user1.profile);
  });

  test('Toggle notifications', () => {
    const notifications = app.toggleNotifications(user1);
  });

  test('Block a user', () => {
    const blockedUsers = app.blockUser(user1, user2);

  });

  test('Reset password', () => {
    const newPassword = app.resetPassword(user1, 'newPassword1');
    expect(newPassword).toBe('newPassword1');
  });

  test('Delete a comment from a post', () => {
    post = app.createPost(user1, 'Post with comments');
    app.commentOnPost(post, 'Comment to delete');
    const comments = app.deleteComment(post, 'Comment to delete');
    expect(comments).not.toContain('Comment to delete');
  });

  test('Update profile visibility', () => {
    const visibility = app.updatePrivacy(user1, 'private');
    expect(visibility).toBe('private');
  });

  test('Report a post', () => {
    post = app.createPost(user1, 'Reportable post');
    const reported = app.reportPost(post);
  });

  test('Mute a user', () => {
    const mutedUsers = app.muteUser(user1, user2);
    expect(mutedUsers).toContain(user2);
  });

  test('Mark post as favorite', () => {
    post = app.createPost(user2, 'Favorite post');
    const favorites = app.markPostAsFavorite(user1, post);
    expect(favorites).toContain(post);
  });

  test('Remove favorite post', () => {
    post = app.createPost(user2, 'Favorite post to remove');
    app.markPostAsFavorite(user1, post);
    const favorites = app.removeFavorite(user1, post);
    expect(favorites).not.toContain(post);
  });
});
