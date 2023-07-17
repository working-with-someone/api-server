import express from 'express';

import userRoute from './user.route';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/user',
    route: userRoute,
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
