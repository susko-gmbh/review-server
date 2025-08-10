export const RESPONSE_TRENDS_PERIOD = {
  SEVEN_DAYS: '7d',
  THIRTY_DAYS: '30d',
  THREE_MONTHS: '3m',
} as const;

export const RESPONSE_TRENDS_MESSAGES = {
  INVALID_PERIOD: 'Invalid period. Must be one of: 7d, 30d, 3m',
  FETCH_SUCCESS: 'Response trends fetched successfully',
  FETCH_ERROR: 'Error fetching response trends',
} as const;