declare namespace NodeJS {
  interface ProcessEnv {
    PROTOCOL: string;
    HOST: string;
    PORT: string;
    SERVER_URL: string;

    APP_SECRET: string;
    TOKEN_USER_SECRET: string;

    DATABASE_HOST: string;
    DATABASE_PORT: string;
    DATABASE_NAME: string;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;

    DATABASE_URL: string;

    REDIS_HOST: string;
    REDIS_PORT: string;

    REDIS_NAME: string;
    REDIS_DATABASE_NUMBER: string;

    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;

    CORS_ALLOWED_ORIGIN: string;

    AWS_REGION: string;
    AWS_BUCKET_NAME: string;
    AWS_DEFAULT_BUCKET_NAME: string;

    AWS_IAM_ACCESS_KEY: string;
    AWS_IAM_SECRET_ACCESS_KEY: string;
  }
}
