import path from 'path';

export const to = {
  media: {
    images: path.posix.join('/media', 'images'),
    default: {
      images: path.posix.join('/media', 'images', 'default'),
    },
  },
  static: {
    video: path.posix.join('/', 'video'),
  },
};

export const servingRootURL = new URL(process.env.SERVER_URL);

export const servingURL = {
  media: {
    images: new URL(to.media.images, servingRootURL),
  },
};

export const mediaServer = {
  to: {
    staticServer: {
      video: new URL('video', process.env.MEDIA_STATIC_SERVER_ORIGIN),
    },
  },
};
