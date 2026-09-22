export type Indices = 'video_session' | 'live_session' | 'category';
export const indices: Indices[] = ['video_session', 'live_session', 'category'];

const _indices = {
  production: {
    video_session: 'video_sessions',
    live_session: 'live_sessions',
    category: 'categories',
  },
  development: {
    video_session: 'video_sessions_dev',
    live_session: 'live_sessions_dev',
    category: 'categories_dev',
  },
  test: {
    video_session: 'video_sessions_test',
    live_session: 'live_sessions_test',
    category: 'categories_test',
  },
};

export function resolveIndex(index: Indices) {
  switch (process.env.NODE_ENV) {
    case 'production':
      return _indices.production[index];
    case 'development':
      return _indices.development[index];
    case 'test':
      return _indices.test[index];
    default:
      throw new Error('Unknown NODE_ENV');
  }
}
