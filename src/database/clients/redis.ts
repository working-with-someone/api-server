import { createClient } from 'redis';
import redisClientConfig from '../../config/redisClient.config';

const redisClient = createClient(redisClientConfig);

export default redisClient;
