"use client";

import { useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import { Comment, User, CommentVote } from "@prisma/client";
import { formatTimeToNow } from "@/lib/utils";
import CommentVotes from "./CommentVote";
import { Button } from "./ui/Button";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Label } from "./ui/Label";
import { Textarea } from "./ui/TextArea";
import { useMutation } from "@tanstack/react-query";
import { CommentRequest } from "@/lib/validators/comment";
import axios, { AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { useCustomToast } from "@/hooks/use-custom-toast";

type ExtendedComment = Comment & {
  author: User;
  votes: Array<CommentVote>;
};

interface PostCommentProps {
  comment: ExtendedComment;
  currentVote?: CommentVote;
  votesAmount: number;
  postId: string;
}

const PostComment = ({
  comment,
  currentVote,
  votesAmount,
  postId,
}: PostCommentProps) => {
  const commentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [input, setInput] = useState("");
  const { LoginToast } = useCustomToast();

  const { mutate: postComment, isLoading } = useMutation({
    mutationFn: async ({ postId, text, replyToId }: CommentRequest) => {
      const payload: CommentRequest = {
        postId,
        text,
        replyToId,
      };

      const { data } = await axios.patch(
        "/api/subreddit/post/comment",
        payload,
      );

      return data;
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          return LoginToast();
        }
      }

      return toast({
        title: "There was a problem.",
        description: "Something went wrong please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      router.refresh();
      setInput("");
      setIsReplying(false);
    },
  });

  return (
    <div className="flex flex-col" ref={commentRef}>
      <div className="flex items-center">
        <UserAvatar
          user={{
            name: comment.author.name,
            image: comment.author.image,
          }}
          className="h-6 w-6"
        />

        <div className="ml-2 flex items-center gap-x-2">
          <p className="font-md text-sm text-gray-900">
            u/${comment.author.username}
          </p>
          <p className="max-h-40 truncate text-xs text-zinc-500">
            {formatTimeToNow(new Date(comment.createdAt))}
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm text-zinc-900">{comment.text}</p>

      <div className="flex items-center gap-2">
        <CommentVotes
          commentId={comment.id}
          initialVotesAmount={votesAmount}
          initialVote={currentVote?.type}
        />

        <Button
          variant={"ghost"}
          size={"xs"}
          onClick={() => {
            if (!session) {
              return router.push("/sign-in");
            }

            setIsReplying((prev) => !prev);
          }}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" />
          Reply
        </Button>
      </div>
      {isReplying && (
        <div className="mt-4 flex w-full flex-col gap-1.5">
          <Label htmlFor="comment">Your comment</Label>
          <div className="mt-2">
            <Textarea
              id="comment"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              placeholder="What are your thoughts?"
            />

            <div className="mt-2 flex justify-end gap-2">
              <Button
                tabIndex={-1}
                variant={"subtle"}
                onClick={() => {
                  setIsReplying(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  postComment({
                    postId,
                    text: input,
                    replyToId: comment.replyToId ?? comment.id,
                  })
                }
                isLoading={isLoading}
                disabled={input.length === 0}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComment;
