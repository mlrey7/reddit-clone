import { getAuthSession } from "@/lib/auth";
import { Post, Vote, VoteType } from "@prisma/client";
import { notFound } from "next/navigation";
import React from "react";
import PostVoteClient from "./PostVoteClient";

interface PostVoteServerProps {
  postId: string;
  initialVotesAmount?: number;
  initialVote?: VoteType;
  getData?: () => Promise<(Post & { votes: Array<Vote> }) | null>;
}
const PostVoteServer = async ({
  postId,
  initialVotesAmount,
  initialVote,
  getData,
}: PostVoteServerProps) => {
  const session = await getAuthSession();

  let _votesAmount = 0;
  let _currentVote: VoteType | undefined = undefined;

  if (getData) {
    const post = await getData();

    if (!post) return notFound();

    _votesAmount = post.votes.reduce(
      (accu, current) => accu + (current.type === "UP" ? 1 : -1),
      0,
    );

    _currentVote = post.votes.find(
      (vote) => vote.userId === session?.user.id,
    )?.type;
  } else {
    _votesAmount = initialVotesAmount ?? 0;
    _currentVote = initialVote;
  }

  return (
    <PostVoteClient
      postId={postId}
      initialVotesAmount={_votesAmount}
      initialVote={_currentVote}
    />
  );
};

export default PostVoteServer;
