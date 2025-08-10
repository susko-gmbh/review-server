import { Router } from 'express';
// import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

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

// Create new review
router.post(
  '/',
  /* auth('user', 'admin'), */
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewController.createReview
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
