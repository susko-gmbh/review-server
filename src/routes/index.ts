import { Router } from 'express';
import { UserRoute } from '../app/modules/user/user.route';
import { ReviewRoutes } from '../app/modules/review/review.route';
import { ReviewerReplyRoutes } from '../app/modules/reviewer-reply/reviewer-reply.route';
import { StatsRoutes } from '../app/modules/stats/stats.route';
import { ReviewTrendsRoute } from '../app/modules/review-trends/review-trends.route';
import { ResponseTrendsRoute } from '../app/modules/response-trends/response-trends.route';
import { InfoRoute } from '../app/modules/info/info.route';
import { WebhookRoute } from '../app/modules/webhook/webhook.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: UserRoute,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/reviewer-replies',
    route: ReviewerReplyRoutes,
  },
  {
    path: '/stats',
    route: StatsRoutes,
  },
  {
    path: '/review-trends',
    route: ReviewTrendsRoute,
  },
  {
    path: '/response-trends',
    route: ResponseTrendsRoute,
  },
  {
    path: '/info',
    route: InfoRoute,
  },
  {
    path: '/webhook',
    route: WebhookRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
