export interface TBusinessInfo {
  businessProfileId: string;
  businessProfileName: string;
  totalReviews: number;
  averageRating: number;
  pendingReplies: number;
  responseRate: number;
  lastReviewDate: string | null;
  firstReviewDate: string | null;
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
  recentReviews: {
    reviewId: string;
    starRating: string;
    comment: string;
    createTime: string;
    reviewer: {
      displayName: string;
      profilePhotoUrl: string;
    };
  }[];
}

export interface TBusinessInfoQuery {
  includeRecentReviews?: boolean;
  recentReviewsLimit?: number;
}