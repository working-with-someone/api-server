import 'dotenv/config';

import http from 'http';
import app from './app';
import redisClient from './database/clients/redis';
import s3Client from './database/clients/s3';

const server = http.createServer(app);

function serverListening() {
  console.log(`Server is listening on port ${process.env.PORT} 🔥`);
  redisClient.connect();
}

server.on('close', () => {
  s3Client.destroy();
  redisClient.disconnect();
});

server.listen(process.env.PORT, serverListening);

export default server;
