import { Router } from 'express';
import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ResponseTrendsController } from './response-trends.controller';
import { ResponseTrendsValidation } from './response-trends.validation';

const router = Router();

// Protected routes
router.get(
  '/',
  auth('user', 'admin'),
  validateRequest(ResponseTrendsValidation.getResponseTrendsValidationSchema),
  ResponseTrendsController.getResponseTrends
);

export const ResponseTrendsRoute = router;