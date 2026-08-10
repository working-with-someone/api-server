import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ES_SERVER_URL,
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD,
  },
});

export default esClient;
