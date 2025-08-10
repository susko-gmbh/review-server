export const REVIEW_STATUS = {
  PENDING: 'pending',
  REPLIED: 'replied',
  IGNORED: 'ignored',
} as const;

export const STAR_RATING = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
  FOUR: 'FOUR',
  FIVE: 'FIVE',
} as const;

export const REVIEW_MESSAGES = {
  FETCH_SUCCESS: 'Reviews fetched successfully',
  CREATE_SUCCESS: 'Review created successfully',
  UPDATE_SUCCESS: 'Review updated successfully',
  DELETE_SUCCESS: 'Review deleted successfully',
  NOT_FOUND: 'Review not found',
  FETCH_ERROR: 'Error fetching reviews',
  CREATE_ERROR: 'Error creating review',
  UPDATE_ERROR: 'Error updating review',
  DELETE_ERROR: 'Error deleting review',
} as const;

export const REVIEW_SEARCH_FIELDS = ['comment', 'reviewer.displayName', 'businessProfileName'] as const;