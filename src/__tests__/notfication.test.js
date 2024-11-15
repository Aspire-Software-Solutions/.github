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

  test('Unhide a post', () => {
    app.hidePost(user1, post);
    const hiddenPosts = app.unhidePost(user1, post);
    expect(hiddenPosts).not.toContain(post);
  });

  test('Share a post on a platform', () => {
    const shares = app.sharePost(post, 'Facebook');
    expect(shares['Facebook']).toBe(1);
  });

  test('React to a post', () => {
    const reactions = app.reactToPost(post, 'like');
    expect(reactions['like']).toBe(1);
  });

  test('Edit a comment', () => {
    const newContent = 'Edited comment content';
    const editedContent = app.editComment(post, comment, newContent);
    expect(editedContent).toBe(newContent);
  });
});
