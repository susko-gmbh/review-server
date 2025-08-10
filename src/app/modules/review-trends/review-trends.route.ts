import { Router } from 'express';
import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReviewTrendsController } from './review-trends.controller';
import { ReviewTrendsValidation } from './review-trends.validation';

const router = Router();

// Protected routes
router.get(
  '/',
  auth('user', 'admin'),
  validateRequest(ReviewTrendsValidation.getReviewTrendsValidationSchema),
  ReviewTrendsController.getReviewTrends
);

export const ReviewTrendsRoute = router;