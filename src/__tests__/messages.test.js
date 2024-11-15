// App.test.js

import { App } from '/Users/miafelipe/Desktop/coding/RIVAL/app.js';

describe('App', () => {
  let app, user1, user2, post;

  beforeEach(() => {
    app = new App();
    user1 = app.signUp('user1@example.com', 'password1');
    user2 = app.signUp('user2@example.com', 'password2');
  });

  test('Archive a post', () => {
    post = app.createPost(user1, 'Archivable post');
    const archived = app.archivePost(post);
    expect(archived).toBe(true);
  });

  test('Reactivate an archived post', () => {
    post = app.createPost(user1, 'Archived post to reactivate');
    app.archivePost(post);
    const reactivated = app.reactivatePost(post);
    expect(reactivated).toBe(false);
  });

  test('Check blocked users', () => {
    app.blockUser(user1, user2);
  });

  test('Ensure notifications are off by default after toggle', () => {
    app.toggleNotifications(user1);
  });
});
