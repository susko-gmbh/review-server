import { Router } from 'express';
// import auth from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

// Get all reviews with filters
router.get(
  '/',
  // auth('user', 'admin'),
  // validateRequest(ReviewValidation.getReviewsValidationSchema),
  ReviewController.getAllReviews
);

// Get recent reviews
router.get(
  '/recent',
  /* auth('user', 'admin'), */ ReviewController.getRecentReviews
);

// Get reviews by business profile ID
router.get(
  '/profile/:businessProfileId',
  /* auth('user', 'admin'), */
  ReviewController.getReviewsByBusinessProfileId
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
