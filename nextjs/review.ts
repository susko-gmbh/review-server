import { ObjectId } from 'mongodb';

// Updated ReviewDocument interface to match the new data structure
export interface ReviewDocument {
  _id?: ObjectId;
  reviewId: string;
  businessProfileId: string; // Convert the large number to string for storage
  businessProfileName: string;
  executionTimestamp: string; // NEW - from the root level
  reviewer: {
    profilePhotoUrl: string;
    displayName: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string; // Optional - some reviews don't have comments
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
    aiGenerated?: boolean;
  };
  replyStatus: 'pending' | 'replied' | 'ignored';
  sentimentScore?: number;
  responseTimeHours?: number;
  name: string; // This is the full resource name path
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for the MongoDB document structure (with nested reviews array)
export interface ReviewsCollectionDocument {
  _id?: ObjectId;
  businessProfileId: number | string; // Large number like 4.19023967901107e+18
  businessProfileName: string;
  executionTimestamp: string;
  reviews: GoogleReview[];
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// New interface to match the complete JSON structure from your client
export interface GoogleReviewsResponse {
  businessProfileId: number; // Large number like 4.19023967901107e+18
  businessProfileName: string;
  executionTimestamp: string;
  reviews: GoogleReview[];
}

export interface GoogleReview {
  reviewId: string;
  reviewer: {
    profilePhotoUrl: string;
    displayName: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string; // Optional - some reviews don't have comments
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
  name: string; // Full resource path
}

// Keep existing interfaces unchanged
export interface ProfileStatsDocument {
  _id?: ObjectId;
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

export interface DashboardStatsDocument {
  _id?: ObjectId;
  totalReviews: number;
  pendingReplies: number;
  averageRating: number;
  responseRate: number;
  reviewTrends: Array<{ month: string; count: number; rating?: number }>;
  reviewTrends3Months?: Array<{ month: string; count: number; rating?: number }>;
  reviewTrends30Days?: Array<{ day: string; count: number; rating?: number }>;
  reviewTrends7Days?: Array<{ day: string; count: number; rating?: number }>;
  responseTrends?: Array<{ month: string; responseTime: number; replyRate: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  lastUpdated: Date;
}
