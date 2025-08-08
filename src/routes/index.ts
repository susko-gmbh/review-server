import { Router } from 'express';
import { UserRoute } from '../app/modules/user/user.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: UserRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
