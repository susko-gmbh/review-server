import { z } from 'zod';

const getReviewTrendsValidationSchema = z.object({
  query: z.object({
    period: z
      .enum(['7d', '30d', '3m', '12m'])
      .optional()
      .default('30d'),
    profileId: z.string().optional(),
  }),
});

export const ReviewTrendsValidation = {
  getReviewTrendsValidationSchema,
};