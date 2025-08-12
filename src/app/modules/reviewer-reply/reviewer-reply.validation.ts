import { z } from 'zod';

const getReviewerRepliesValidationSchema = z.object({
  params: z.object({
    businessProfileId: z.string({
      required_error: 'Business Profile ID is required',
    }),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

const getReviewerReplyByIdValidationSchema = z.object({
  params: z.object({
    reviewId: z.string({
      required_error: 'Review ID is required',
    }),
  }),
});

const deleteReviewerReplyValidationSchema = z.object({
  params: z.object({
    reviewId: z.string({
      required_error: 'Review ID is required',
    }),
  }),
});

export {
  getReviewerRepliesValidationSchema,
  getReviewerReplyByIdValidationSchema,
  deleteReviewerReplyValidationSchema,
};