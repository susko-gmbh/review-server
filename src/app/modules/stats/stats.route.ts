import express from 'express';
import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { StatsController } from './stats.controller';
import { StatsValidation } from './stats.validation';

const router = express.Router();

// GET /api/stats - Get dashboard stats
router.get(
  '/',
  auth('user', 'admin'),
  validateRequest(StatsValidation.getDashboardStatsValidationSchema),
  StatsController.getDashboardStats,
);

// GET /api/stats/profile - Get profile stats
router.get(
  '/profile',
  auth('user', 'admin'),
  validateRequest(StatsValidation.getProfileStatsValidationSchema),
  StatsController.getProfileStats,
);

// GET /api/stats/filtered - Get filtered stats
router.get(
  '/filtered',
  auth('user', 'admin'),
  validateRequest(StatsValidation.getFilteredStatsValidationSchema),
  StatsController.getFilteredStats,
);

export const StatsRoutes = router;