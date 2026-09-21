import http from 'node:http';
import s3Client from './database/clients/s3';
import redisClient from './database/clients/redis';
import app from './app';
import prismaClient from './database/clients/prisma';
import './patch/global';
import searchService from './lib/search';

const server = http.createServer((req, res) => {
  serverReady
    .then(() => app(req, res))
    .catch(() => {
      res.statusCode = 503;
      res.end('Server dependencies are unavailable');
    });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT} 🔥`);
});

async function bootstrap() {
  try {
    // prisma client는 connect를 명시적으로 call할 필요는 없지만 첫 request와 lazy connection을 방지
    await Promise.all([
      searchService.init(),
      prismaClient.$connect(),
      redisClient.connect(),
    ]);
  } catch (err) {
    console.error('Failed to initialize server dependencies', err);
    process.exit(1);
  }
}

export const serverReady = bootstrap();

server.on('close', () => {
  s3Client.destroy();
  prismaClient.$disconnect();

  if (redisClient.isOpen) {
    redisClient.disconnect();
  }
});

export default server;
