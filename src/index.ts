import s3Client from './database/clients/s3';
import redisClient from './database/clients/redis';
import app from './app';
import prismaClient from './database/clients/prisma';
import './patch/global';

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT} 🔥`);
  // prisma client는 connect를 명시적으로 call할 필요는 없지만 첫 request와 lazy connection을 방지
  prismaClient.$connect();
  redisClient.connect();
});

server.on('close', () => {
  s3Client.destroy();
  prismaClient.$disconnect();
  redisClient.disconnect();
});

export default server;
