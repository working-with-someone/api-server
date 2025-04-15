import { LRUCache } from 'lru-cache';

const options = {
  max: 500,
};
const cache = new LRUCache(options);

export default cache;
