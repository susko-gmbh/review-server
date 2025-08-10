import { z } from 'zod';

const getResponseTrendsValidationSchema = z.object({
  query: z.object({
    period: z
      .enum(['7d', '30d', '3m'])
      .optional()
      .default('30d'),
    profileId: z.string().optional(),
  }),
});

export const ResponseTrendsValidation = {
  getResponseTrendsValidationSchema,
};