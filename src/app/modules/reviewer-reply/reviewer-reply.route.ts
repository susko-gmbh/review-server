import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  getReviewerRepliesByBusinessProfile,
  getReviewerReplyById,
  deleteReviewerReply,
} from './reviewer-reply.controller';
import {
  getReviewerRepliesValidationSchema,
  getReviewerReplyByIdValidationSchema,
  deleteReviewerReplyValidationSchema,
} from './reviewer-reply.validation';

const router = Router();

// Get reviewer replies by business profile ID
router.get(
  '/:businessProfileId',
  validateRequest(getReviewerRepliesValidationSchema),
  getReviewerRepliesByBusinessProfile
);

// Get single reviewer reply by review ID
router.get(
  '/review/:reviewId',
  validateRequest(getReviewerReplyByIdValidationSchema),
  getReviewerReplyById
);

// Delete reviewer reply by review ID
router.delete(
  '/review/:reviewId',
  validateRequest(deleteReviewerReplyValidationSchema),
  deleteReviewerReply
);

export const ReviewerReplyRoutes = router;