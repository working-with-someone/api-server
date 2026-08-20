export type Index = 'video_session' | 'live_session';

const _Indexes = {
  production: {
    video_session: 'video_sessions',
    live_session: 'live_sessions',
  },
  development: {
    video_session: 'video_sessions_dev',
    live_session: 'live_sessions_dev',
  },
  test: {
    video_session: 'video_sessions_test',
    live_session: 'live_sessions_test',
  },
};

export function resolveIndex(index: Index) {
  switch (process.env.NODE_ENV) {
    case 'production':
      return _Indexes.production[index];
    case 'development':
      return _Indexes.development[index];
    case 'test':
      return _Indexes.test[index];
    default:
      throw new Error('Unknown NODE_ENV');
  }
}
