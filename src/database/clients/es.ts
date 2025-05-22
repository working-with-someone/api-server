import { Client } from '@elastic/elasticsearch';

const esClinet = new Client({
  node: process.env.ES_SERVER_URL,
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD,
  },
});

const init = async () => {
  const isExistt = await esClinet.indices.exists({
    index: 'live_session',
  });

  if (!isExistt) {
    await esClinet.indices.create({
      index: 'live_session',
    });
  }
};

export default esClinet;
