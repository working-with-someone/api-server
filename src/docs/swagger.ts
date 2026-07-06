import swaggerJSDoc from 'swagger-jsdoc';

const paginationExample = {
    total: 125,
    page: 1,
    per_page: 20,
    total_pages: 7,
    has_next: true,
    has_prev: false,
}

interface responseBody {
    data: Record<string, unknown> | Record<string, unknown>[] | string | null;
    pagination?: {
        "currentPage": number;
        "totalPages": number;
        "totalItems": number;
        "per_page": number;
        "hasMore": boolean;
        "previousPage": number | null;
        "nextPage": 2
    }
}
const okResponse = (description: string, example: responseBody) => ({
    description,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/DataResponse' },
            example: { data: example },
        },
    },
});

const okListResponse = (
    description: string,
    items: responseBody,
    withPagination = false
) => ({
    description,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/DataArrayResponse' },
            example: withPagination
                ? { data: items, pagination: paginationExample }
                : { data: items },
        },
    },
});

const createdResponse = (
    description: string,
    example: responseBody
) => ({
    description,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/DataResponse' },
            example: { data: example },
        },
    },
});

const definition = {
    openapi: '3.0.3',
    info: {
        title: 'WWS API',
        version: '1.0.0',
        description: 'API documentation for WWS server.',
    },
    servers: [
        {
            url: '/',
            description: 'Current server',
        },
    ],
    components: {
        securitySchemes: {
            sessionAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'connect.sid',
            },
        },
        parameters: {
            Page: {
                name: 'page',
                in: 'query',
                schema: { type: 'integer', minimum: 1, default: 1 },
            },
            PerPage: {
                name: 'per_page',
                in: 'query',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            },
            UserId: {
                name: 'user_id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
            VideoSessionId: {
                name: 'video_session_id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
            LiveSessionId: {
                name: 'live_session_id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
            CommentId: {
                name: 'comment_id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
            CategoryLabel: {
                name: 'category_label',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
            FollowingUserId: {
                name: 'following_user_id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
            Priority: {
                name: 'priority',
                in: 'path',
                required: true,
                schema: { type: 'integer' },
            },
            ImageKey: {
                name: 'key',
                in: 'path',
                required: true,
                schema: { type: 'string' },
            },
        },
        schemas: {
            DataResponse: {
                type: 'object',
                required: ['data'],
                properties: {
                    data: {
                        type: 'object',
                        additionalProperties: true,
                    },
                },
            },
            DataArrayResponse: {
                type: 'object',
                required: ['data'],
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            additionalProperties: true,
                        },
                    },
                    pagination: {
                        type: 'object',
                        additionalProperties: true,
                    },
                },
            },
            ErrorResponse: {
                type: 'object',
                required: ['code', 'message'],
                properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string', example: 'Invalid request parameter' },
                },
            },
        },
    },
    security: [{ sessionAuth: [] }],
    tags: [
        { name: 'Media' },
        { name: 'Categories' },
        { name: 'Users' },
        { name: 'Follows' },
        { name: 'Preferred Categories' },
        { name: 'User Video Sessions' },
        { name: 'Live Sessions' },
        { name: 'Live Break Time' },
        { name: 'Video Sessions' },
        { name: 'Video Session Likes' },
        { name: 'Video Session Comments' },
        { name: 'Video Session Comment Likes' },
    ],
    paths: {
        '/media/images/{key}': {
            get: {
                tags: ['Media'],
                summary: 'Get uploaded image by key',
                parameters: [{ $ref: '#/components/parameters/ImageKey' }],
                responses: {
                    '200': {
                        description: 'Image stream',
                        content: {
                            'image/jpeg': {
                                schema: { type: 'string', format: 'binary' },
                            },
                        },
                    },
                    '400': { description: 'Bad request' },
                    '404': { description: 'Image not found' },
                },
            },
        },
        '/media/images/default/{key}': {
            get: {
                tags: ['Media'],
                summary: 'Get default image by key',
                parameters: [{ $ref: '#/components/parameters/ImageKey' }],
                responses: {
                    '200': {
                        description: 'Image stream',
                        content: {
                            'image/jpeg': {
                                schema: { type: 'string', format: 'binary' },
                            },
                        },
                    },
                    '400': { description: 'Bad request' },
                    '404': { description: 'Image not found' },
                },
            },
        },
        '/categories': {
            get: {
                tags: ['Categories'],
                summary: 'Get categories',
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                ],
                responses: {
                    '200': okListResponse('Categories list', {
                        "data": [
                            {
                                "label": "code",
                                "_count": {
                                    "live_session": 10,
                                    "video_session": 16
                                }
                            }
                        ]
                    }),
                    '400': { description: 'Bad request' },
                },
            },
        },
        '/users/self': {
            get: {
                tags: ['Users'],
                summary: 'Get authenticated user profile',
                responses: {
                    '200': okResponse('User profile', {
                        "data": {
                            "id": 84,
                            "username": "seungho",
                            "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                            "email": "kmc54320@gmail.com",
                            "created_at": "2026-07-01T18:13:23.579Z",
                            "updated_at": "2026-07-02T10:40:58.838Z",
                            "followers_count": 0,
                            "followings_count": 0,
                            "pfp": {
                                "user_id": 84,
                                "curr": "/media/images/default/pfp",
                                "is_default": true
                            },
                            "preferred_categories": [
                                {
                                    "user_id": 84,
                                    "category_label": "code",
                                    "priority": 0
                                },
                                {
                                    "user_id": 84,
                                    "category_label": "eat",
                                    "priority": 1
                                },
                                {
                                    "user_id": 84,
                                    "category_label": "game",
                                    "priority": 2
                                },
                                {
                                    "user_id": 84,
                                    "category_label": "get beauty",
                                    "priority": 3
                                }
                            ]
                        }
                    }),
                    '401': { description: 'Unauthorized' },
                },
            },
        },
        '/users/{user_id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user profile',
                parameters: [{ $ref: '#/components/parameters/UserId' }],
                responses: {
                    '200': okResponse('User profile', {
                        "data": {
                            "id": 84,
                            "username": "seungho",
                            "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                            "email": "kmc54320@gmail.com",
                            "created_at": "2026-07-01T18:13:23.579Z",
                            "updated_at": "2026-07-02T10:40:58.838Z",
                            "followers_count": 0,
                            "followings_count": 0,
                            "pfp": {
                                "user_id": 84,
                                "curr": "/media/images/default/pfp",
                                "is_default": true
                            },
                            "preferred_categories": [
                                {
                                    "user_id": 84,
                                    "category_label": "code",
                                    "priority": 0
                                },
                                {
                                    "user_id": 84,
                                    "category_label": "eat",
                                    "priority": 1
                                },
                                {
                                    "user_id": 84,
                                    "category_label": "game",
                                    "priority": 2
                                },
                                {
                                    "user_id": 84,
                                    "category_label": "get beauty",
                                    "priority": 3
                                }
                            ]
                        }
                    }),
                    '400': { description: 'Bad request' },
                    '404': { description: 'User not found' },
                },
            },
            put: {
                tags: ['Users'],
                summary: 'Update user profile',
                parameters: [{ $ref: '#/components/parameters/UserId' }],
                requestBody: {
                    required: false,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    username: { type: 'string' },
                                    pfpToDefault: { type: 'boolean' },
                                    pfp: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': okResponse('Updated user profile', {
                        "data": {
                            "id": 84,
                            "username": "postmanAgent",
                            "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                            "email": "kmc54320@gmail.com",
                            "created_at": "2026-07-01T18:13:23.579Z",
                            "updated_at": "2026-07-05T12:38:27.921Z",
                            "followers_count": 0,
                            "followings_count": 0,
                            "pfp": {
                                "user_id": 84,
                                "curr": "/media/images/default/pfp",
                                "is_default": true
                            }
                        }
                    }),
                    '400': { description: 'Bad request' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/users/{user_id}/followings': {
            get: {
                tags: ['Follows'],
                summary: 'Get following users',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                ],
                responses: {
                    '200': okListResponse('Following users list', {
                        "data": [
                            {
                                "follower_user_id": 84,
                                "following_user_id": 88
                            }
                        ]
                    }),
                    '400': { description: 'Bad request' },
                    '404': { description: 'User not found' },
                },
            },
        },
        '/users/{user_id}/followings/{following_user_id}': {
            get: {
                tags: ['Follows'],
                summary: 'Get a specific following relationship',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/FollowingUserId' },
                ],
                responses: {
                    '200': okResponse('Following relation', {
                        "data": {
                            "follower_user_id": 84,
                            "following_user_id": 88
                        }
                    }),
                    '404': { description: 'Relation not found' },
                },
            },
            post: {
                tags: ['Follows'],
                summary: 'Create following relationship',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/FollowingUserId' },
                ],
                responses: {
                    '201': createdResponse('Created following relation', {
                        "data": {
                            "follower_user_id": 84,
                            "following_user_id": 98
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Target user not found' },
                    '409': { description: 'Already following' },
                },
            },
            delete: {
                tags: ['Follows'],
                summary: 'Delete following relationship',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/FollowingUserId' },
                ],
                responses: {
                    '204': { description: 'No content' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Relation not found' },
                },
            },
        },
        '/users/{user_id}/followers': {
            get: {
                tags: ['Follows'],
                summary: 'Get followers of user',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                ],
                responses: {
                    '200': okListResponse('Followers list', {
                        "data": [
                            {
                                "id": 97,
                                "username": "Janet75",
                                "encrypted_password": "$2b$10$PC9wrQ6UDmG2OudJ.vE4BOj76FCd/6xWTs9zDvMaOnvC6u9k7Mn0q",
                                "email": "Emmanuel_Larson@yahoo.com",
                                "created_at": "2026-07-01T18:13:24.956Z",
                                "updated_at": "2026-07-01T18:13:26.002Z",
                                "followers_count": 1,
                                "followings_count": 2
                            }
                        ]
                    }),
                    '404': { description: 'User not found' },
                },
            },
        },
        '/users/{user_id}/preferred-categories': {
            get: {
                tags: ['Preferred Categories'],
                summary: 'Get preferred categories of user',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                ],
                responses: {
                    '200': okListResponse('Preferred categories list', {
                        "data": [
                            {
                                "user_id": 84,
                                "category_label": "code",
                                "priority": 0
                            },
                            {
                                "user_id": 84,
                                "category_label": "eat",
                                "priority": 1
                            },
                            {
                                "user_id": 84,
                                "category_label": "game",
                                "priority": 2
                            },
                            {
                                "user_id": 84,
                                "category_label": "get beauty",
                                "priority": 3
                            }
                        ]
                    }),
                    '404': { description: 'User not found' },
                },
            },
        },
        '/users/{user_id}/preferred-categories/{category_label}': {
            post: {
                tags: ['Preferred Categories'],
                summary: 'Create preferred category',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/CategoryLabel' },
                ],
                responses: {
                    '201': createdResponse('Created preferred category', {
                        "data": {
                            "user_id": 84,
                            "category_label": "code",
                            "priority": 3
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'User or category not found' },
                },
            },
            delete: {
                tags: ['Preferred Categories'],
                summary: 'Delete preferred category',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/CategoryLabel' },
                ],
                responses: {
                    '204': { description: 'No content' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'User or category not found' },
                },
            },
        },
        '/users/{user_id}/preferred-categories/{category_label}/priority/{priority}': {
            put: {
                tags: ['Preferred Categories'],
                summary: 'Update preferred category priority',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/CategoryLabel' },
                    { $ref: '#/components/parameters/Priority' },
                ],
                responses: {
                    '200': okResponse('Updated preferred category', {
                        "data": {
                            "user_id": 84,
                            "category_label": "code",
                            "priority": 3
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'User or category not found' },
                },
            },
        },
        '/users/{user_id}/sessions/video': {
            get: {
                tags: ['User Video Sessions'],
                summary: 'Get video sessions of a user',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                ],
                responses: {
                    '200': okListResponse('User video sessions', {
                        "data": [
                            {
                                "id": "d3e59582-f761-438b-86ae-bfcab3c4c404",
                                "title": "code with me",
                                "description": "code with seungho=hub!",
                                "thumbnail_uri": "/media/images/thumbnail-4dbc075d-88af-47ba-b55f-24069d01668a",
                                "duration": "600.0160833333333",
                                "video_id": "13d6c83171fdc9a36ddd76012f8cf54b",
                                "access_level": "PUBLIC",
                                "created_at": "2026-07-05T09:50:28.887Z",
                                "updated_at": "2026-07-05T09:50:28.887Z",
                                "organizer_id": 84,
                                "comment_enabled": true,
                                "category_label": "code",
                                "comment_count": 34,
                                "like_count": 0,
                                "organizer": {
                                    "id": 84,
                                    "username": "postmanAgent",
                                    "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                    "email": "kmc54320@gmail.com",
                                    "created_at": "2026-07-01T18:13:23.579Z",
                                    "updated_at": "2026-07-05T12:42:16.545Z",
                                    "followers_count": 0,
                                    "followings_count": 1
                                }
                            }
                        ]
                    }),
                    '404': { description: 'User not found' },
                },
            },
        },
        '/users/{user_id}/sessions/video/{video_session_id}': {
            get: {
                tags: ['User Video Sessions'],
                summary: 'Get a specific user video session',
                parameters: [
                    { $ref: '#/components/parameters/UserId' },
                    { $ref: '#/components/parameters/VideoSessionId' },
                ],
                responses: {
                    '200': okResponse('User video session', {
                        "data": {
                            "id": "d3e59582-f761-438b-86ae-bfcab3c4c404",
                            "title": "code with me",
                            "description": "code with seungho=hub!",
                            "thumbnail_uri": "/media/images/thumbnail-4dbc075d-88af-47ba-b55f-24069d01668a",
                            "duration": "600.0160833333333",
                            "video_id": "13d6c83171fdc9a36ddd76012f8cf54b",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-05T09:50:28.887Z",
                            "updated_at": "2026-07-05T09:50:28.887Z",
                            "organizer_id": 84,
                            "comment_enabled": true,
                            "category_label": "code",
                            "comment_count": 34,
                            "like_count": 0,
                            "organizer": {
                                "id": 84,
                                "username": "postmanAgent",
                                "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                "email": "kmc54320@gmail.com",
                                "created_at": "2026-07-01T18:13:23.579Z",
                                "updated_at": "2026-07-05T12:42:16.545Z",
                                "followers_count": 0,
                                "followings_count": 1
                            }
                        }
                    }),
                    '404': { description: 'Session not found' },
                },
            },
        },
        '/sessions/live': {
            get: {
                tags: ['Live Sessions'],
                summary: 'Get live sessions',
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                    { name: 'category', in: 'query', schema: { type: 'string' } },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                    {
                        name: 'status',
                        in: 'query',
                        schema: {
                            oneOf: [
                                { type: 'string', enum: ['READY', 'OPENED', 'BREAKED', 'CLOSED'] },
                                {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['READY', 'OPENED', 'BREAKED', 'CLOSED'],
                                    },
                                },
                            ],
                        },
                    },
                ],
                responses: {
                    '200': okListResponse('Live sessions', {
                        "data": [
                            {
                                "id": "039b0b5b-4d1f-4edf-be40-9dfaed195d73",
                                "title": "Ulciscor angulus universe ubi crudelis aer terminatio vorax cuppedia usus.",
                                "description": "Arcus appono cuppedia cimentarius pectus vinitor demitto basium cariosus. Abeo succedo cubitum cultura suffragium. Inflammatio tergum vivo volutabrum amicitia appello defendo impedit dens acervus.\nTurpis subito ipsam cunctatio cunae contego territo. Abscido alioqui adicio stillicidium desino. Tandem tendo capto vigor comis crux aliqua officia confugo vulgo.",
                                "thumbnail_uri": "/media/images/default/thumbnail",
                                "status": "OPENED",
                                "access_level": "PUBLIC",
                                "created_at": "2026-07-01T18:13:26.466Z",
                                "updated_at": "2026-07-01T18:13:26.466Z",
                                "started_at": "2026-06-30T20:28:52.891Z",
                                "organizer_id": 102,
                                "category_label": "study",
                                "like_count": 0,
                                "break_time": null,
                                "category": {
                                    "label": "study"
                                },
                                "live_session_transition_log": [
                                    {
                                        "id": 447,
                                        "live_session_id": "039b0b5b-4d1f-4edf-be40-9dfaed195d73",
                                        "from_state": "READY",
                                        "to_state": "OPENED",
                                        "transitioned_at": "2026-07-01T15:05:13.861Z"
                                    }
                                ],
                                "organizer": {
                                    "id": 102,
                                    "username": "Raymond73",
                                    "encrypted_password": "$2b$10$Tej91YxmfqEkRv..4dJsUOwtJM2serRDwOKQhrwytCHLhk8QA9h5a",
                                    "email": "Riley.Prohaska@gmail.com",
                                    "created_at": "2026-07-01T18:13:25.476Z",
                                    "updated_at": "2026-07-01T18:13:26.027Z",
                                    "followers_count": 1,
                                    "followings_count": 0,
                                    "pfp": {
                                        "user_id": 102,
                                        "curr": "/media/images/default/pfp",
                                        "is_default": true
                                    }
                                }
                            },
                            {
                                "id": "10b28a75-0f04-4348-afb2-37f08b212f7c",
                                "title": "Comparo dicta deludo damno videlicet compello.",
                                "description": "Terminatio terra bardus condico corrupti pel pecto titulus. Coruscus laboriosam atavus fugiat virgo tibi velut quaerat arcesso. Adduco thymbra expedita amplus truculenter denuncio velit statim uredo.\nIusto sponte tripudio bis amplitudo adhuc. Vobis vulnus vallum tantillus subiungo vetus cursim vinum. Subseco ait nostrum contigo alter viridis umbra deporto defluo vivo.",
                                "thumbnail_uri": "/media/images/default/thumbnail",
                                "status": "READY",
                                "access_level": "PUBLIC",
                                "created_at": "2026-07-01T18:13:27.212Z",
                                "updated_at": "2026-07-01T18:13:27.212Z",
                                "started_at": null,
                                "organizer_id": 98,
                                "category_label": "work",
                                "like_count": 0,
                                "break_time": {
                                    "session_id": "10b28a75-0f04-4348-afb2-37f08b212f7c",
                                    "interval": 30,
                                    "duration": 5
                                },
                                "category": {
                                    "label": "work"
                                },
                                "live_session_transition_log": [],
                                "organizer": {
                                    "id": 98,
                                    "username": "Evan80",
                                    "encrypted_password": "$2b$10$w9dJVE9pSs0JBm6pmkJPoOeLF9SvRoufM.Lq1buSv0lLT6H9COs5u",
                                    "email": "Genoveva44@yahoo.com",
                                    "created_at": "2026-07-01T18:13:25.058Z",
                                    "updated_at": "2026-07-05T12:42:16.545Z",
                                    "followers_count": 2,
                                    "followings_count": 0,
                                    "pfp": {
                                        "user_id": 98,
                                        "curr": "/media/images/default/pfp",
                                        "is_default": true
                                    }
                                }
                            }
                        ],
                        "pagination": {
                            "currentPage": 1,
                            "totalPages": 13,
                            "totalItems": 25,
                            "per_page": 2,
                            "hasMore": true,
                            "previousPage": null,
                            "nextPage": 2
                        }
                    }, true),
                },
            },
            post: {
                tags: ['Live Sessions'],
                summary: 'Create live session',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['title', 'access_level'],
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    access_level: {
                                        type: 'string',
                                        enum: ['PUBLIC', 'FOLLOWER_ONLY', 'PRIVATE'],
                                    },
                                    category: { type: 'string' },
                                    thumbnail: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': createdResponse('Created live session', {
                        "data": {
                            "id": "eebe9044-14e5-4071-9e5f-c00d82c7e103",
                            "title": "test with postman",
                            "description": "api test with postman!",
                            "thumbnail_uri": "/media/images/default/thumbnail",
                            "status": "READY",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-05T13:39:01.529Z",
                            "updated_at": "2026-07-05T13:39:01.529Z",
                            "started_at": null,
                            "organizer_id": 84,
                            "category_label": "study",
                            "like_count": 0
                        }
                    }),
                    '400': { description: 'Bad request' },
                },
            },
        },
        '/sessions/live/{live_session_id}': {
            get: {
                tags: ['Live Sessions'],
                summary: 'Get live session by id',
                parameters: [{ $ref: '#/components/parameters/LiveSessionId' }],
                responses: {
                    '200': okResponse('Live session', {
                        "data": {
                            "id": "eebe9044-14e5-4071-9e5f-c00d82c7e103",
                            "title": "test with postman",
                            "description": "api test with postman!",
                            "thumbnail_uri": "/media/images/default/thumbnail",
                            "status": "READY",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-05T13:39:01.529Z",
                            "updated_at": "2026-07-05T13:39:01.529Z",
                            "started_at": null,
                            "organizer_id": 84,
                            "category_label": "study",
                            "like_count": 0,
                            "allow": [],
                            "category": {
                                "label": "study"
                            },
                            "break_time": null,
                            "live_session_transition_log": []
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Live session not found' },
                },
            },
        },
        '/sessions/live/{live_session_id}/status': {
            put: {
                tags: ['Live Sessions'],
                summary: 'Update live session status',
                parameters: [{ $ref: '#/components/parameters/LiveSessionId' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: {
                                    status: {
                                        type: 'string',
                                        enum: ['READY', 'OPENED', 'BREAKED', 'CLOSED'],
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': okResponse('Updated live session status', {
                        data: "OPENED"
                    }),
                    '400': { description: 'Invalid status transition' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Live session not found' },
                },
            },
        },
        '/sessions/live/{live_session_id}/thumbnail': {
            put: {
                tags: ['Live Sessions'],
                summary: 'Update live session thumbnail',
                parameters: [{ $ref: '#/components/parameters/LiveSessionId' }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['thumbnail'],
                                properties: {
                                    thumbnail: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': okResponse('Updated thumbnail', {
                        "data": "/media/images/thumbnail-02f90fee-0174-4828-b924-9107cc806ec5"
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Live session not found' },
                },
            },
        },
        '/sessions/live/{live_session_id}/break_time': {
            get: {
                tags: ['Live Break Time'],
                summary: 'Get break time of live session',
                parameters: [{ $ref: '#/components/parameters/LiveSessionId' }],
                responses: {
                    '200': okResponse('Break time', {
                        "data": {
                            "session_id": "332feeac-397b-4a61-ac41-973a13b76282",
                            "interval": 50,
                            "duration": 10
                        }
                    }),
                    '204': { description: 'No break time configured' },
                    '404': { description: 'Live session not found' },
                },
            },
            post: {
                tags: ['Live Break Time'],
                summary: 'Create break time for live session',
                parameters: [{ $ref: '#/components/parameters/LiveSessionId' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['interval', 'duration'],
                                properties: {
                                    interval: { type: 'integer', minimum: 1 },
                                    duration: { type: 'integer', minimum: 1 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': createdResponse('Created break time', {
                        "data": {
                            "session_id": "332feeac-397b-4a61-ac41-973a13b76282",
                            "interval": 50,
                            "duration": 10
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Live session not found' },
                },
            },
        },
        '/sessions/video': {
            get: {
                tags: ['Video Sessions'],
                summary: 'Get video sessions',
                parameters: [
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                    { name: 'category', in: 'query', schema: { type: 'string' } },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    '200': okListResponse('Video sessions', {
                        "data": {
                            "id": "40f6d719-33ee-41df-abcf-efd48a3c6636",
                            "title": "Triduana vado uterque solum summopere.",
                            "description": "Recusandae tamen eos tergo comparo repellat arcus. Creber caecus victoria depraedor conitor corroboro terror coadunatio. Terebro rerum desolo comedo suadeo.\nTamen reprehenderit basium surgo tyrannus temeritas angulus. Casus umquam collum aro adaugeo soluta cavus cervus. Vado vestrum stillicidium creator utique spargo clibanus.",
                            "thumbnail_uri": "/media/images/default/thumbnail",
                            "duration": "01:49:00",
                            "video_id": "97db7a64-a4a9-4ee6-b012-cf7eb7864e07",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-01T18:13:50.598Z",
                            "updated_at": "2026-07-01T18:13:50.598Z",
                            "organizer_id": 99,
                            "comment_enabled": true,
                            "category_label": "eat",
                            "comment_count": 2,
                            "like_count": 6,
                            "allow": [],
                            "category": {
                                "label": "eat"
                            },
                            "break_time": null,
                            "organizer": {
                                "id": 99,
                                "username": "Marlen_Cremin82",
                                "encrypted_password": "$2b$10$QyNbADw2l1YuGOnA.T8F4e2QK9rFewUalbmgKbjxaSqaEsjAdjj5e",
                                "email": "Angie_McKenzie@hotmail.com",
                                "created_at": "2026-07-01T18:13:25.163Z",
                                "updated_at": "2026-07-01T18:13:26.076Z",
                                "followers_count": 1,
                                "followings_count": 2,
                                "pfp": {
                                    "user_id": 99,
                                    "curr": "/media/images/default/pfp",
                                    "is_default": true
                                }
                            },
                            "_count": {
                                "likes": 6
                            }
                        }
                    }, true),
                },
            },
            post: {
                tags: ['Video Sessions'],
                summary: 'Create video session',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['video_id', 'access_level'],
                                properties: {
                                    video_id: { type: 'string' },
                                    access_level: {
                                        type: 'string',
                                        enum: ['PUBLIC', 'FOLLOWER_ONLY', 'PRIVATE'],
                                    },
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    category_label: { type: 'string' },
                                    comment_enabled: { type: 'boolean' },
                                    thumbnail: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': createdResponse('Created video session', {
                        "data": {
                            "id": "6a6f947a-98fc-45f4-a353-d2d665db0157",
                            "title": "code with me",
                            "description": "code with me description",
                            "thumbnail_uri": "/media/images/default/thumbnail",
                            "duration": "600.0160833333333",
                            "video_id": "a72742e6d315098daae2e30fcfe45a5f",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-05T14:13:25.690Z",
                            "updated_at": "2026-07-05T14:13:25.690Z",
                            "organizer_id": 84,
                            "comment_enabled": true,
                            "category_label": "code",
                            "comment_count": 0,
                            "like_count": 0,
                            "break_time": null,
                            "category": {
                                "label": "code"
                            },
                            "organizer": {
                                "id": 84,
                                "username": "postmanAgent",
                                "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                "email": "kmc54320@gmail.com",
                                "created_at": "2026-07-01T18:13:23.579Z",
                                "updated_at": "2026-07-05T12:42:16.545Z",
                                "followers_count": 0,
                                "followings_count": 1,
                                "pfp": {
                                    "user_id": 84,
                                    "curr": "/media/images/default/pfp",
                                    "is_default": true
                                }
                            },
                            "allow": []
                        }
                    }),
                    '400': { description: 'Bad request' },
                },
            },
        },
        '/sessions/video/{video_session_id}': {
            get: {
                tags: ['Video Sessions'],
                summary: 'Get video session by id',
                parameters: [{ $ref: '#/components/parameters/VideoSessionId' }],
                responses: {
                    '200': okResponse('Video session', {
                        "data": {
                            "id": "6a6f947a-98fc-45f4-a353-d2d665db0157",
                            "title": "code with me",
                            "description": "code with me description",
                            "thumbnail_uri": "/media/images/default/thumbnail",
                            "duration": "600.0160833333333",
                            "video_id": "a72742e6d315098daae2e30fcfe45a5f",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-05T14:13:25.690Z",
                            "updated_at": "2026-07-05T14:13:25.690Z",
                            "organizer_id": 84,
                            "comment_enabled": true,
                            "category_label": "code",
                            "comment_count": 0,
                            "like_count": 0,
                            "allow": [],
                            "category": {
                                "label": "code"
                            },
                            "break_time": null,
                            "organizer": {
                                "id": 84,
                                "username": "postmanAgent",
                                "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                "email": "kmc54320@gmail.com",
                                "created_at": "2026-07-01T18:13:23.579Z",
                                "updated_at": "2026-07-05T12:42:16.545Z",
                                "followers_count": 0,
                                "followings_count": 1,
                                "pfp": {
                                    "user_id": 84,
                                    "curr": "/media/images/default/pfp",
                                    "is_default": true
                                }
                            },
                            "_count": {
                                "likes": 0
                            }
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Video session not found' },
                },
            },
            put: {
                tags: ['Video Sessions'],
                summary: 'Update video session',
                parameters: [{ $ref: '#/components/parameters/VideoSessionId' }],
                requestBody: {
                    required: false,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    access_level: {
                                        type: 'string',
                                        enum: ['PUBLIC', 'FOLLOWER_ONLY', 'PRIVATE'],
                                    },
                                    category_label: { type: 'string' },
                                    comment_enabled: { type: 'boolean' },
                                    thumbnail: { type: 'string', format: 'binary' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': okResponse('Updated video session', {
                        "data": {
                            "id": "6a6f947a-98fc-45f4-a353-d2d665db0157",
                            "title": "code with me",
                            "description": "code with me description",
                            "thumbnail_uri": "/media/images/default/thumbnail",
                            "duration": "600.0160833333333",
                            "video_id": "a72742e6d315098daae2e30fcfe45a5f",
                            "access_level": "PUBLIC",
                            "created_at": "2026-07-05T14:13:25.690Z",
                            "updated_at": "2026-07-05T14:13:25.690Z",
                            "organizer_id": 84,
                            "comment_enabled": true,
                            "category_label": "code",
                            "comment_count": 0,
                            "like_count": 0,
                            "allow": [],
                            "category": {
                                "label": "code"
                            },
                            "break_time": null,
                            "organizer": {
                                "id": 84,
                                "username": "postmanAgent",
                                "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                "email": "kmc54320@gmail.com",
                                "created_at": "2026-07-01T18:13:23.579Z",
                                "updated_at": "2026-07-05T12:42:16.545Z",
                                "followers_count": 0,
                                "followings_count": 1,
                                "pfp": {
                                    "user_id": 84,
                                    "curr": "/media/images/default/pfp",
                                    "is_default": true
                                }
                            },
                            "_count": {
                                "likes": 0
                            }
                        }
                    }),
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Video session not found' },
                },
            },
        },
        '/sessions/video/{video_session_id}/like': {
            get: {
                tags: ['Video Session Likes'],
                summary: 'Get current user like on video session',
                parameters: [{ $ref: '#/components/parameters/VideoSessionId' }],
                responses: {
                    '200': okResponse('Like relation', {
                        "data": {
                            "user_id": 84,
                            "created_at": "2026-07-05T14:17:21.290Z",
                            "video_session_id": "6a6f947a-98fc-45f4-a353-d2d665db0157"
                        }
                    }),
                    '404': { description: 'Like not found' },
                },
            },
            post: {
                tags: ['Video Session Likes'],
                summary: 'Create like on video session',
                parameters: [{ $ref: '#/components/parameters/VideoSessionId' }],
                responses: {
                    '201': createdResponse('Like created', {
                        "data": {
                            "user_id": 84,
                            "created_at": "2026-07-05T14:17:21.290Z",
                            "video_session_id": "6a6f947a-98fc-45f4-a353-d2d665db0157"
                        }
                    }),
                    '409': { description: 'Like already exists' },
                },
            },
            delete: {
                tags: ['Video Session Likes'],
                summary: 'Delete like on video session',
                parameters: [{ $ref: '#/components/parameters/VideoSessionId' }],
                responses: {
                    '204': { description: 'No content' },
                    '404': { description: 'Like not found' },
                },
            },
        },
        '/sessions/video/{video_session_id}/comment': {
            get: {
                tags: ['Video Session Comments'],
                summary: 'Get comments of video session',
                parameters: [
                    { $ref: '#/components/parameters/VideoSessionId' },
                    { $ref: '#/components/parameters/Page' },
                    { $ref: '#/components/parameters/PerPage' },
                    {
                        name: 'sort',
                        in: 'query',
                        schema: { type: 'string', enum: ['recent'], default: 'recent' },
                    },
                ],
                responses: {
                    '200': okListResponse('Video session comments', {
                        "data": [
                            {
                                "id": "585",
                                "content": "test",
                                "created_at": "2026-07-05T14:19:29.352Z",
                                "updated_at": "2026-07-05T14:19:29.352Z",
                                "user_id": 84,
                                "video_session_id": "6a6f947a-98fc-45f4-a353-d2d665db0157",
                                "like_count": 0,
                                "user": {
                                    "id": 84,
                                    "username": "postmanAgent",
                                    "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                    "email": "kmc54320@gmail.com",
                                    "created_at": "2026-07-01T18:13:23.579Z",
                                    "updated_at": "2026-07-05T12:42:16.545Z",
                                    "followers_count": 0,
                                    "followings_count": 1,
                                    "pfp": {
                                        "user_id": 84,
                                        "curr": "/media/images/default/pfp",
                                        "is_default": true
                                    }
                                },
                                "likes": []
                            }
                        ]
                    }, true),
                    '404': { description: 'Video session not found' },
                },
            },
            post: {
                tags: ['Video Session Comments'],
                summary: 'Create comment on video session',
                parameters: [{ $ref: '#/components/parameters/VideoSessionId' }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['content'],
                                properties: {
                                    content: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': createdResponse('Comment created', {
                        "data": {
                            "id": "585",
                            "content": "test",
                            "created_at": "2026-07-05T14:19:29.352Z",
                            "updated_at": "2026-07-05T14:19:29.352Z",
                            "user_id": 84,
                            "video_session_id": "6a6f947a-98fc-45f4-a353-d2d665db0157",
                            "like_count": 0,
                            "user": {
                                "id": 84,
                                "username": "postmanAgent",
                                "encrypted_password": "$2b$10$vgdUCcas6.zozbQoZZb19ujwqMWCpyx5VVo06Xqf4cEIb3RmGsGyS",
                                "email": "kmc54320@gmail.com",
                                "created_at": "2026-07-01T18:13:23.579Z",
                                "updated_at": "2026-07-05T12:42:16.545Z",
                                "followers_count": 0,
                                "followings_count": 1,
                                "pfp": {
                                    "user_id": 84,
                                    "curr": "/media/images/default/pfp",
                                    "is_default": true
                                }
                            }
                        }
                    }),
                    '403': { description: 'Comment disabled' },
                },
            },
        },
        '/sessions/video/{video_session_id}/comment/{comment_id}': {
            get: {
                tags: ['Video Session Comments'],
                summary: 'Get a single comment',
                parameters: [
                    { $ref: '#/components/parameters/VideoSessionId' },
                    { $ref: '#/components/parameters/CommentId' },
                ],
                responses: {
                    '200': okResponse('Comment', {
                        "data": {
                            "id": "585",
                            "content": "test",
                            "created_at": "2026-07-05T14:19:29.352Z",
                            "updated_at": "2026-07-05T14:19:29.352Z",
                            "user_id": 84,
                            "video_session_id": "6a6f947a-98fc-45f4-a353-d2d665db0157",
                            "like_count": 0
                        }
                    }),
                    '404': { description: 'Comment not found' },
                },
            },
            delete: {
                tags: ['Video Session Comments'],
                summary: 'Delete a comment',
                parameters: [
                    { $ref: '#/components/parameters/VideoSessionId' },
                    { $ref: '#/components/parameters/CommentId' },
                ],
                responses: {
                    '204': { description: 'No content' },
                    '403': { description: 'Forbidden' },
                    '404': { description: 'Comment not found' },
                },
            },
        },
        '/sessions/video/{video_session_id}/comment/{comment_id}/like': {
            get: {
                tags: ['Video Session Comment Likes'],
                summary: 'Get current user like on comment',
                parameters: [
                    { $ref: '#/components/parameters/VideoSessionId' },
                    { $ref: '#/components/parameters/CommentId' },
                ],
                responses: {
                    '200': okResponse('Comment like relation', {
                        "data": {
                            "video_session_comment_id": "585",
                            "created_at": "2026-07-05T14:23:39.568Z",
                            "user_id": 84
                        }
                    }),
                    '404': { description: 'Like not found' },
                },
            },
            post: {
                tags: ['Video Session Comment Likes'],
                summary: 'Create like on comment',
                parameters: [
                    { $ref: '#/components/parameters/VideoSessionId' },
                    { $ref: '#/components/parameters/CommentId' },
                ],
                responses: {
                    '201': createdResponse('Comment like created', {
                        "data": {
                            "video_session_comment_id": "585",
                            "created_at": "2026-07-05T14:23:39.568Z",
                            "user_id": 84
                        }
                    }),
                    '409': { description: 'Like already exists' },
                },
            },
            delete: {
                tags: ['Video Session Comment Likes'],
                summary: 'Delete like on comment',
                parameters: [
                    { $ref: '#/components/parameters/VideoSessionId' },
                    { $ref: '#/components/parameters/CommentId' },
                ],
                responses: {
                    '204': { description: 'No content' },
                    '404': { description: 'Like not found' },
                },
            },
        },
    },
};

const options = {
    definition,
    apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
