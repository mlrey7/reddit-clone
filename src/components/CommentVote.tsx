"use client";

import { useCustomToast } from "@/hooks/use-custom-toast";
import { usePrevious } from "@mantine/hooks";
import { VoteType } from "@prisma/client";
import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { match } from "ts-pattern";
import { Button } from "@/components/ui/Button";
import { CommentVoteRequest } from "@/lib/validators/vote";

interface PostVoteClientProps {
  commentId: string;
  initialVotesAmount: number;
  initialVote?: VoteType;
}

const CommentVotes = ({
  commentId,
  initialVotesAmount,
  initialVote,
}: PostVoteClientProps) => {
  const { LoginToast } = useCustomToast();
  const [votesAmount, setVotesAmount] = useState(initialVotesAmount);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);

  const { mutate: vote } = useMutation({
    mutationFn: async (type: VoteType) => {
      const payload: CommentVoteRequest = {
        commentId,
        voteType: type,
      };

      await axios.patch("/api/subreddit/post/comment/vote", payload);
    },
    onError: (err, voteType) => {
      if (voteType === "UP") {
        setVotesAmount((prev) => prev - 1);
      } else {
        setVotesAmount((prev) => prev + 1);
      }

      setCurrentVote(prevVote);

      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return LoginToast();
        }
      }

      return toast({
        title: "Something went wrong",
        description: "Your vote was not registered please try again",
        variant: "destructive",
      });
    },
    onMutate: (type) => {
      match([currentVote, type])
        .with([undefined, "UP"], () => {
          setCurrentVote(type);
          setVotesAmount((prev) => prev + 1);
        })
        .with([undefined, "DOWN"], () => {
          setCurrentVote(type);
          setVotesAmount((prev) => prev - 1);
        })
        .with(["UP", "UP"], () => {
          setCurrentVote(undefined);
          setVotesAmount((prev) => prev - 1);
        })
        .with(["DOWN", "DOWN"], () => {
          setCurrentVote(undefined);
          setVotesAmount((prev) => prev + 1);
        })
        .with(["DOWN", "UP"], () => {
          setCurrentVote(type);
          setVotesAmount((prev) => prev + 2);
        })
        .with(["UP", "DOWN"], () => {
          setCurrentVote(type);
          setVotesAmount((prev) => prev - 2);
        })
        .otherwise(() => {});
    },
  });

  return (
    <div className="flex gap-1">
      <Button
        size={"sm"}
        variant={"ghost"}
        aria-label="upvote"
        onClick={() => vote("UP")}
      >
        <ArrowBigUp
          className={cn("h-5 w-5 text-zinc-700", {
            "fill-emerald-500 text-emerald-500": currentVote === "UP",
          })}
        />
      </Button>

      <p className="py-2 text-center text-sm font-medium text-zinc-900">
        {votesAmount}
      </p>

      <Button
        size={"sm"}
        variant={"ghost"}
        aria-label="downvote"
        onClick={() => vote("DOWN")}
      >
        <ArrowBigDown
          className={cn("h-5 w-5 text-zinc-700", {
            "fill-red-500 text-red-500": currentVote === "DOWN",
          })}
        />
      </Button>
    </div>
  );
};

export default CommentVotes;
