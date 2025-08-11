export type TReviewStatus = 'pending' | 'replied' | 'ignored';
export type TStarRating = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';

export interface TReviewer {
  profilePhotoUrl: string;
  displayName: string;
}

export interface TReviewReply {
  comment: string;
  updateTime: string;
  aiGenerated?: boolean;
}

export interface TReview {
  _id?: string;
  reviewId: string;
  businessProfileId: string;
  businessProfileName: string;
  executionTimestamp: string;
  reviewer: TReviewer;
  starRating: TStarRating;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: TReviewReply;
  replyStatus: TReviewStatus;
  sentimentScore?: number;
  responseTimeHours?: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TReviewQuery {
  profileId?: string;
  status?: string;
  rating?: string;
  search?: string;
  aiGenerated?: boolean;
  replyStartDate?: string;
  replyEndDate?: string;
  page?: number;
  limit?: number;
}

export interface TReviewResponse {
  success: boolean;
  message: string;
  data: {
    reviews: TReview[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TCreateReview {
  reviewId: string;
  businessProfileId: string;
  businessProfileName: string;
  executionTimestamp: string;
  reviewer: TReviewer;
  starRating: TStarRating;
  comment?: string;
  createTime: string;
  updateTime: string;
  name: string;
}

export interface TUpdateReview {
  reviewReply?: TReviewReply;
  replyStatus?: TReviewStatus;
  sentimentScore?: number;
  responseTimeHours?: number;
}

export interface TReviewReplyMessage {
  content: string;
  role: string;
  refusal: string | null;
  annotations: unknown[];
}

export interface TReviewReplyWithMessage {
  reviewId: string;
  reviewer: TReviewer;
  starRating: TStarRating;
  comment?: string;
  createTime: string;
  updateTime: string;
  name: string;
  message: TReviewReplyMessage;
  index: number;
  logprobs: unknown | null;
  finish_reason: string;
}

export interface TReviewRepliesQuery {
  businessProfileId?: string;
  startDate?: string;
  endDate?: string;
  aiGenerated?: boolean;
  page?: number;
  limit?: number;
}