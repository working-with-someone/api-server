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

    CORS_ALLOWED_ORIGIN: string;
  }
}
