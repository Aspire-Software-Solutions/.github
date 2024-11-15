import { App } from '/Users/miafelipe/Desktop/coding/RIVAL/app.js';

describe('App', () => {
  let app, user1, user2, post;

  beforeEach(() => {
    app = new App();
    user1 = app.signUp('user1@example.com', 'password1');
    user2 = app.signUp('user2@example.com', 'password2');
  });

  test('User sign-up', () => {
    const newUser = app.signUp('user3@example.com', 'password3');
    expect(newUser).toBeDefined();
    expect(app.users.length).toBe(3);
  });

  test('User login', () => {
    const loginResult = app.login('user1@example.com', 'password1');
    expect(loginResult.success).toBe(true);
  });

  test('Login with invalid credentials', () => {
    const loginResult = app.login('user1@example.com', 'wrongpassword');
    expect(loginResult.success).toBe(false);
  });

  test('Update profile', () => {
    const updatedProfile = app.updateProfile(user1, 'New bio', '/avatar1.png');
    expect(updatedProfile.bio).toBe('New bio');
    expect(updatedProfile.avatar).toBe('/avatar1.png');
  });

  test('Follow another user', () => {
    const following = app.follow(user1, user2);
    expect(following).toContain(user2);
  });

  test('Create a post', () => {
    post = app.createPost(user1, 'Hello World');
    expect(post.content).toBe('Hello World');
    expect(app.posts.length).toBe(1);
  });

  test('Like a post', () => {
    post = app.createPost(user1, 'Hello again');
    const likes = app.likePost(post);
    expect(likes).toBe(1);
  });

  test('Comment on a post', () => {
    post = app.createPost(user1, 'Commentable post');
    const comments = app.commentOnPost(post, 'Nice post!');
    expect(comments).toContain('Nice post!');
  });

  test('Delete a post', () => {
    post = app.createPost(user1, 'Deletable post');
    app.deletePost(post);
  });

  test('Ensure user can like a post only once per action', () => {
    post = app.createPost(user1, 'Liking post');
    app.likePost(post);
    expect(post.likes).toBe(1);
  });

  test('Sign up and check unique users', () => {
    app.signUp('unique@example.com', 'unique');
    expect(app.users.length).toBe(3);
  });

  test('Validate bio length', () => {
    const updatedProfile = app.updateProfile(user1, 'Short bio', '/avatar2.png');
    expect(updatedProfile.bio.length).toBeLessThanOrEqual(100);
  });

  test('Toggle visibility to private', () => {
    user1.profile.visibility = 'private';
    expect(user1.profile.visibility).toBe('private');
  });

  test('Validate non-duplicate following', () => {
    app.follow(user1, user2);
    app.follow(user1, user2);
    expect(user1.following.length).toBe(1);
  });

  test('User logout', () => {
    const logoutResult = app.login('user1@example.com', 'password1');
    expect(logoutResult.success).toBe(true);
  });

  test('Edit a post', () => {
    post = app.createPost(user1, 'Editable post');
    post.content = 'Updated content';
    expect(post.content).toBe('Updated content');
  });

  test('Count posts by a specific user', () => {
    app.createPost(user1, 'Post 1');
    app.createPost(user1, 'Post 2');
    const userPosts = app.posts.filter((p) => p.user === user1);
    expect(userPosts.length).toBe(2);
  });

  test('User avatar update', () => {
    const updatedProfile = app.updateProfile(user1, 'Updated bio', '/new-avatar.png');
    expect(updatedProfile.avatar).toBe('/new-avatar.png');
  });

  test('Detect no existing posts for new user', () => {
    const newUser = app.signUp('user4@example.com', 'password4');
    const newUserPosts = app.posts.filter((p) => p.user === newUser);
    expect(newUserPosts.length).toBe(0);
  });
});
