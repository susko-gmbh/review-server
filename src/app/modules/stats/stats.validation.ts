import { z } from 'zod';

const getDashboardStatsValidationSchema = z.object({
  params: z.object({
    businessProfileId: z.string().min(1, 'Business profile ID is required'),
  }),
});

const getProfileStatsValidationSchema = z.object({
  params: z.object({
    businessProfileId: z.string().min(1, 'Business profile ID is required'),
  }),
});

const getFilteredStatsValidationSchema = z.object({
  params: z.object({
    businessProfileId: z.string().min(1, 'Business profile ID is required'),
  }),
  query: z.object({
    status: z.string().optional(),
    rating: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const StatsValidation = {
  getDashboardStatsValidationSchema,
  getProfileStatsValidationSchema,
  getFilteredStatsValidationSchema,
};