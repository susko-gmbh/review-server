import { z } from 'zod';

const getDashboardStatsValidationSchema = z.object({
  query: z.object({
    profileId: z.string().optional(),
  }),
});

const getProfileStatsValidationSchema = z.object({
  query: z.object({}),
});

const getFilteredStatsValidationSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    rating: z.string().optional(),
    profileId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const StatsValidation = {
  getDashboardStatsValidationSchema,
  getProfileStatsValidationSchema,
  getFilteredStatsValidationSchema,
};