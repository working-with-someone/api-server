import type { Prisma } from "@prisma/client";

export type PublicVideoSessionComment = Prisma.video_session_commentGetPayload<{
    include: {
        user: {
            include: {
                pfp: true
            }
        }
        video_session: true
    }
}>