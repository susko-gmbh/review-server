import { z } from 'zod';

const getBusinessInfoValidationSchema = z.object({
  params: z.object({
    businessProfileId: z
      .string({
        required_error: 'Business profile ID is required',
      })
      .min(1, 'Business profile ID cannot be empty'),
  }),
  query: z
    .object({
      includeRecentReviews: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
      recentReviewsLimit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 5))
        .refine((val) => val >= 1 && val <= 20, {
          message: 'Recent reviews limit must be between 1 and 20',
        }),
    })
    .optional(),
});

export const InfoValidation = {
  getBusinessInfoValidationSchema,
};
