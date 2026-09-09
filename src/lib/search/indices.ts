export type Indices = 'video_session' | 'live_session';
export const indices: Indices[] = ['video_session', 'live_session'];

const _indices = {
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
