import 'dotenv/config';

import http from 'http';
import app from './app';

const server = http.createServer(app);

function serverListening() {
  console.log(`Server is listening on port ${process.env.PORT}`);
}

server.listen(process.env.PORT, serverListening);
