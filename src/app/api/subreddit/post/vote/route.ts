import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { PostVoteValidator } from "@/lib/validators/vote";
import { CachedPost } from "@/types/redis";
import { z } from "zod";

const CACHE_AFTER_UPVOTES = 1;

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const { postId, voteType } = PostVoteValidator.parse(body);

    const existingVote = await db.vote.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        votes: true,
      },
    });

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    if (!existingVote) {
      await db.vote.create({
        data: {
          type: voteType,
          postId,
          userId: session.user.id,
        },
      });

      const votesAmount = post.votes.reduce((accu, current) => {
        return accu + (current.type === "UP" ? 1 : -1);
      }, 0);

      if (votesAmount >= CACHE_AFTER_UPVOTES) {
        const cachePayload: CachedPost = {
          authorUsername: post.author.username ?? "",
          id: post.id,
          title: post.title,
          content: JSON.stringify(post.content),
          createdAt: post.createdAt,
          currentVote: voteType,
        };

        await redis.hset(`post:${postId}`, cachePayload);
      }

      return new Response("Successfully voted");
    }

    if (existingVote.type === voteType) {
      await db.vote.delete({
        where: {
          userId_postId: {
            postId,
            userId: session.user.id,
          },
        },
      });

      return new Response("Vote deleted");
    }

    await db.vote.update({
      where: {
        userId_postId: {
          postId,
          userId: session.user.id,
        },
      },
      data: {
        type: voteType,
      },
    });

    const votesAmount = post.votes.reduce((accu, current) => {
      return accu + (current.type === "UP" ? 1 : -1);
    }, 0);

    if (votesAmount >= CACHE_AFTER_UPVOTES) {
      const cachePayload: CachedPost = {
        authorUsername: post.author.username ?? "",
        id: post.id,
        title: post.title,
        content: JSON.stringify(post.content),
        createdAt: post.createdAt,
        currentVote: voteType,
      };

      await redis.hset(`post:${postId}`, cachePayload);
    }

    return new Response("Successfully changed the vote");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Could not register your vote", { status: 500 });
  }
}
