export const INFO_MESSAGES = {
  FETCH_SUCCESS: 'Business info fetched successfully',
  FETCH_ERROR: 'Error fetching business info',
  NOT_FOUND: 'Business profile not found',
} as const;

export const INFO_DEFAULTS = {
  BUSINESS_INFO: {
    totalReviews: 0,
    averageRating: 0,
    pendingReplies: 0,
    responseRate: 0,
    lastReviewDate: null,
    firstReviewDate: null,
    ratingDistribution: [],
    recentReviews: [],
  },
} as const;