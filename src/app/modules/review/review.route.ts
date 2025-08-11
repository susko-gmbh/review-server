import { Router } from 'express';
// import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

// Create new review (PUT BEFORE PARAMETERIZED ROUTES)
router.post(
  '/',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewController.createReview
);

// Create multiple reviews in batch
router.post(
  '/batch',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.createBatchReviewsValidationSchema),
  ReviewController.createBatchReviews
);

// Get reply summary with filtering options
router.get(
  '/replies/summary',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.getReplySummaryValidationSchema),
  ReviewController.getReplySummary
);

// Get last reply date and total replies for that day
router.get(
  '/replies/last-date',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.getLastReplyDateValidationSchema),
  ReviewController.getLastReplyDate
);

// Get all reviews with filters by business profile ID
router.get(
  '/:businessProfileId',
  // auth('user', 'admin'),
  validateRequest(ReviewValidation.getReviewsValidationSchema),
  ReviewController.getAllReviews
);

// Get recent reviews by business profile ID
router.get(
  '/:businessProfileId/recent',
  /* auth('user', 'admin'), */ ReviewController.getRecentReviews
);

// Get review by ID
router.get(
  '/:id',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.getReviewByIdValidationSchema),
  ReviewController.getReviewById
);

// Update review
router.patch(
  '/:id',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.updateReviewValidationSchema),
  ReviewController.updateReview
);

// Delete review
router.delete(
  '/:id',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.deleteReviewValidationSchema),
  ReviewController.deleteReview
);

export const ReviewRoutes = router;
