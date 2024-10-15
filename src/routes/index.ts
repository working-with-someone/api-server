import express from 'express';

import userRoute from './user/user.route';
import mediaRoute from './media.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/media',
    route: mediaRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: undefined,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (process.env.NODE_ENV === 'development') {
  devRoutes.forEach((route) => {
    return;
  });
}

export default router;
