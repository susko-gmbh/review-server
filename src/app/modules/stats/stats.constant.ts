export const STATS_MESSAGES = {
  DASHBOARD_FETCH_SUCCESS: 'Dashboard stats fetched successfully',
  PROFILE_FETCH_SUCCESS: 'Profile stats fetched successfully',
  FILTERED_FETCH_SUCCESS: 'Filtered stats fetched successfully',
  FETCH_ERROR: 'Error fetching stats',
  DASHBOARD_FETCH_ERROR: 'Error fetching dashboard stats',
  PROFILE_FETCH_ERROR: 'Error fetching profile stats',
  FILTERED_FETCH_ERROR: 'Error fetching filtered stats',
} as const;

export const STATS_DEFAULTS = {
  DASHBOARD_STATS: {
    totalReviews: 0,
    pendingReplies: 0,
    averageRating: 0,
    responseRate: 0,
    reviewTrends: [],
    ratingDistribution: [],
  },
  PROFILE_STATS: [],
} as const;