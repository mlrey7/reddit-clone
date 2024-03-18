import { Comment, Post, Subreddit, User, Vote } from "@prisma/client";

export type ExtendedPost = Post & {
  subreddit: Subreddit;
  votes: Array<Vote>;
  author: User;
  comments: Array<Comment>;
};
