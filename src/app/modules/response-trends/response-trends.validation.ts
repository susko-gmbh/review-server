import { z } from 'zod';

const getResponseTrendsValidationSchema = z.object({
  params: z.object({
    businessProfileId: z.string(),
  }),
  query: z.object({
    period: z
      .enum(['7d', '30d', '3m'])
      .optional()
      .default('30d'),
  }),
});

export const ResponseTrendsValidation = {
  getResponseTrendsValidationSchema,
};