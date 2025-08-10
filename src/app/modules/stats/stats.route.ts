import { Router } from 'express';
// import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { StatsController } from './stats.controller';
import { StatsValidation } from './stats.validation';

const router = Router();

// GET /api/stats/:businessProfileId - Get dashboard stats
router.get(
  '/:businessProfileId',
  /* auth('user', 'admin'), */
  validateRequest(StatsValidation.getDashboardStatsValidationSchema),
  StatsController.getDashboardStats
);

// GET /api/stats/:businessProfileId/profile - Get profile stats
router.get(
  '/:businessProfileId/profile',
  /* auth('user', 'admin'), */
  validateRequest(StatsValidation.getProfileStatsValidationSchema),
  StatsController.getProfileStats
);

// GET /api/stats/:businessProfileId/filtered - Get filtered stats
router.get(
  '/:businessProfileId/filtered',
  /* auth('user', 'admin'), */
  validateRequest(StatsValidation.getFilteredStatsValidationSchema),
  StatsController.getFilteredStats
);

export const StatsRoutes = router;