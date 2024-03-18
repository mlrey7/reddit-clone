import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommentVoteValidator } from "@/lib/validators/vote";
import { z } from "zod";

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const { commentId, voteType } = CommentVoteValidator.parse(body);

    const existingVote = await db.commentVote.findFirst({
      where: {
        commentId,
        userId: session.user.id,
      },
    });

    if (!existingVote) {
      await db.commentVote.create({
        data: {
          type: voteType,
          commentId,
          userId: session.user.id,
        },
      });

      return new Response("Successfully voted");
    }

    if (existingVote.type === voteType) {
      await db.commentVote.delete({
        where: {
          userId_commentId: {
            commentId,
            userId: session.user.id,
          },
        },
      });

      return new Response("Vote deleted");
    }

    await db.commentVote.update({
      where: {
        userId_commentId: {
          commentId,
          userId: session.user.id,
        },
      },
      data: {
        type: voteType,
      },
    });

    return new Response("Successfully changed the vote");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Could not register your vote", { status: 500 });
  }
}
