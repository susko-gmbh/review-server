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
  params: z.object({
    businessProfileId: z.string().min(1, 'Business profile ID is required'),
  }),
  query: z.object({
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

const createBatchReviewsValidationSchema = z.object({
  body: z.object({
    businessProfileId: z.union([z.string(), z.number()]).transform(String),
    businessProfileName: z.string().min(1, 'Business profile name is required'),
    executionTimestamp: z.string().min(1, 'Execution timestamp is required'),
    reviews: z.array(
      z.object({
        reviewId: z.string().min(1, 'Review ID is required'),
        reviewer: reviewerSchema,
        starRating: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']),
        comment: z.string().optional(),
        createTime: z.string().min(1, 'Create time is required'),
        updateTime: z.string().min(1, 'Update time is required'),
        reviewReply: reviewReplySchema.optional(),
        name: z.string().min(1, 'Name is required'),
      })
    ).min(1, 'At least one review is required'),
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

const getReplySummaryValidationSchema = z.object({
  query: z.object({
    businessProfileId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    aiGenerated: z.string().transform((val) => val === 'true').optional(),
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  }),
});

export const ReviewValidation = {
  getReviewsValidationSchema,
  createReviewValidationSchema,
  createBatchReviewsValidationSchema,
  updateReviewValidationSchema,
  deleteReviewValidationSchema,
  getReviewByIdValidationSchema,
  getReplySummaryValidationSchema,
};