export interface GetUserVideoSessionsInput {
    userId: number;
    currUserId: number;
    page: number;
    per_page: number;
}

export interface GetUserVideoSessionInput {
    userId: number;
    videoSessionId: string;
    currUserId: number;
}