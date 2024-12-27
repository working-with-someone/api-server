import path from 'path';

export const to = {
  media: {
    images: path.posix.join('/media', 'images'),
    default: {
      images: path.posix.join('/media', 'images', 'default'),
    },
  },
};

const servingRootURL = new URL(process.env.SERVER_URL);

export const servingURL = {
  media: {
    images: new URL(to.media.images, servingRootURL),
  },
};
