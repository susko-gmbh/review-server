export const REVIEW_TRENDS_PERIOD = {
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  THREE_MONTHS: '3m',
  TWELVE_MONTHS: '12m',
} as const;

export const REVIEW_TRENDS_MESSAGES = {
  INVALID_PERIOD: 'Invalid period. Must be one of: 7d, 30d, 3m, 12m',
  FETCH_SUCCESS: 'Review trends fetched successfully',
  FETCH_ERROR: 'Error fetching review trends',
} as const;