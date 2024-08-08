import type { RedisClientOptions } from 'redis';

const config: RedisClientOptions = {
  name: process.env.REDIS_NAME,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DATABASE_NUMBER),
};

export default config;
