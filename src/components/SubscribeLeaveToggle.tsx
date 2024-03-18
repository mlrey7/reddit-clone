"use client";

import { Button } from "./ui/Button";
import { useMutation } from "@tanstack/react-query";
import { SubscribeToSubredditPayload } from "@/lib/validators/subreddit";
import axios, { AxiosError } from "axios";
import { useCustomToast } from "@/hooks/use-custom-toast";
import { toast } from "@/hooks/use-toast";
import { startTransition } from "react";
import { useRouter } from "next/navigation";

const SubscribeLeaveToggle = ({
  subredditId,
  subredditName,
  isSubscribed,
}: {
  subredditId: string;
  subredditName: string;
  isSubscribed: boolean;
}) => {
  const { LoginToast } = useCustomToast();
  const router = useRouter();

  const { mutate: subscribe, isLoading: isSubLoading } = useMutation({
    mutationFn: async () => {
      const payload: SubscribeToSubredditPayload = {
        subredditId,
      };

      const { data } = await axios.post("/api/subreddit/subscribe", payload);
      return data as string;
    },
    onError(error) {
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
    onSuccess() {
      startTransition(() => {
        router.refresh();
      });

      return toast({
        title: "Subscribed",
        description: `You are now subscribed to r/${subredditName}`,
      });
    },
  });

  const { mutate: unsubscribe, isLoading: isUnsubLoading } = useMutation({
    mutationFn: async () => {
      const payload: SubscribeToSubredditPayload = {
        subredditId,
      };

      const { data } = await axios.post("/api/subreddit/unsubscribe", payload);
      return data as string;
    },
    onError(error) {
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
    onSuccess() {
      startTransition(() => {
        router.refresh();
      });

      return toast({
        title: "Unsubscribed",
        description: `You left r/${subredditName}`,
      });
    },
  });

  return !!isSubscribed ? (
    <Button
      className="mb-4 mt-1 w-full"
      onClick={() => unsubscribe()}
      isLoading={isUnsubLoading}
    >
      Leave community
    </Button>
  ) : (
    <Button
      className="mb-4 mt-1 w-full"
      onClick={() => subscribe()}
      isLoading={isSubLoading}
    >
      Join to post
    </Button>
  );
};

export default SubscribeLeaveToggle;
