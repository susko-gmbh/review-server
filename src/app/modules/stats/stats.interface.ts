export interface TRatingDistribution {
  rating: number;
  count: number;
}

export interface TReviewTrend {
  month: string;
  count: number;
  rating?: number;
}

export interface TDashboardStats {
  _id?: string;
  totalReviews: number;
  pendingReplies: number;
  averageRating: number;
  responseRate: number;
  reviewTrends: TReviewTrend[];
  reviewTrends3Months?: TReviewTrend[];
  reviewTrends30Days?: Array<{ day: string; count: number; rating?: number }>;
  reviewTrends7Days?: Array<{ day: string; count: number; rating?: number }>;
  responseTrends?: Array<{ month: string; responseTime: number; replyRate: number }>;
  ratingDistribution: TRatingDistribution[];
  lastUpdated: Date;
}

export interface TProfileStats {
  _id?: string;
  profileId: string;
  profileName: string;
  totalReviews: number;
  averageRating: number;
  pendingReplies: number;
  responseRate: number;
  lastReviewDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TFilteredStats {
  totalReviews: number;
  pendingReplies: number;
  averageRating: number;
}

export interface TStatsQuery {
  profileId?: string;
}

export interface TFilteredStatsQuery {
  status?: string;
  rating?: string;
  profileId?: string;
  search?: string;
}

export interface TDashboardStatsResponse {
  dashboardStats: TDashboardStats;
  profileStats: TProfileStats[];
}

export interface TFilteredStatsResponse {
  success: boolean;
  totalReviews: number;
  pendingReplies: number;
  averageRating: number;
}