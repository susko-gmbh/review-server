import { z } from 'zod';

const getReviewTrendsValidationSchema = z.object({
  params: z.object({
    businessProfileId: z.string(),
  }),
  query: z.object({
    period: z
      .enum(['7d', '30d', '3m', '12m'])
      .optional()
      .default('30d'),
  }),
});

export const ReviewTrendsValidation = {
  getReviewTrendsValidationSchema,
};