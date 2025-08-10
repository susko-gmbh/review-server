import { z } from 'zod';

const reviewerSchema = z.object({
  profilePhotoUrl: z.string().url('Invalid profile photo URL'),
  displayName: z.string().min(1, 'Display name is required'),
});

const reviewReplySchema = z.object({
  comment: z.string().min(1, 'Reply comment is required'),
  updateTime: z.string().min(1, 'Update time is required'),
  aiGenerated: z.boolean().optional(),
});

const getReviewsValidationSchema = z.object({
  query: z.object({
    profileId: z.string().optional(),
    status: z.enum(['pending', 'replied', 'ignored']).optional(),
    rating: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']).optional(),
    search: z.string().optional(),
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
  }),
});

const createReviewValidationSchema = z.object({
  body: z.object({
    reviewId: z.string().min(1, 'Review ID is required'),
    businessProfileId: z.string().min(1, 'Business profile ID is required'),
    businessProfileName: z.string().min(1, 'Business profile name is required'),
    executionTimestamp: z.string().min(1, 'Execution timestamp is required'),
    reviewer: reviewerSchema,
    starRating: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']),
    comment: z.string().optional(),
    createTime: z.string().min(1, 'Create time is required'),
    updateTime: z.string().min(1, 'Update time is required'),
    name: z.string().min(1, 'Name is required'),
  }),
});

const updateReviewValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required'),
  }),
  body: z.object({
    reviewReply: reviewReplySchema.optional(),
    replyStatus: z.enum(['pending', 'replied', 'ignored']).optional(),
    sentimentScore: z.number().min(-1).max(1).optional(),
    responseTimeHours: z.number().min(0).optional(),
  }),
});

const deleteReviewValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required'),
  }),
});

const getReviewByIdValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Review ID is required'),
  }),
});

export const ReviewValidation = {
  getReviewsValidationSchema,
  createReviewValidationSchema,
  updateReviewValidationSchema,
  deleteReviewValidationSchema,
  getReviewByIdValidationSchema,
};