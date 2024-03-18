"use client";

import { INFINITE_SCROLLING_PAGINATION_RESULTS } from "@/config";
import { ExtendedPost } from "@/types/db";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import Post from "./Post";

interface PostFeedProps {
  initialPosts: Array<ExtendedPost>;
  subredditName?: string;
}

const PostFeed = ({ initialPosts, subredditName }: PostFeedProps) => {
  const lastPostRef = useRef<HTMLUListElement>(null);

  const { data: session } = useSession();

  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["infinite-query", subredditName ?? "custom-feed"],
    queryFn: async ({ pageParam = 1 }) => {
      const query =
        `/api/posts?limit=${INFINITE_SCROLLING_PAGINATION_RESULTS}&page=${pageParam}` +
        (!!subredditName ? `&subredditName=${subredditName}` : "");
      const { data } = await axios.get(query);
      return data as ExtendedPost[];
    },
    getNextPageParam: (_, pages) => {
      return pages.length + 1;
    },
    initialData: {
      pages: [initialPosts],
      pageParams: [1],
    },
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  const posts = data?.pages.flat() ?? initialPosts;

  return (
    <ul
      className="col-span-2 flex list-none flex-col space-y-6"
      ref={lastPostRef}
    >
      {posts.map((post, index) => {
        const votesAmount = post.votes.reduce((voteSum, currentVote) => {
          return voteSum + (currentVote.type === "UP" ? 1 : -1);
        }, 0);

        const currentVote = post.votes.find(
          (vote) => vote.userId === session?.user.id,
        );

        if (index === posts.length - 1) {
          return (
            <li key={post.id} ref={ref}>
              <Post
                subredditName={post.subreddit.name}
                post={post}
                commentAmount={post.comments.length}
                votesAmount={votesAmount}
                currentVote={currentVote}
              />
            </li>
          );
        } else {
          return (
            <li key={post.id}>
              <Post
                subredditName={post.subreddit.name}
                post={post}
                commentAmount={post.comments.length}
                votesAmount={votesAmount}
                currentVote={currentVote}
              />
            </li>
          );
        }
      })}
    </ul>
  );
};

export default PostFeed;
