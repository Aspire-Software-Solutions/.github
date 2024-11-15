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
  }
  
  