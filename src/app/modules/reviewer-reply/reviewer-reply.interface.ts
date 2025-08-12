export interface TReviewerReply {
  reviewId: string;
  businessProfileId: string;
  reviewer: {
    profilePhotoUrl: string;
    displayName: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment: string;
  createTime: string;
  updateTime: string;
  name: string;
  message: {
    content: string;
    role: string;
    refusal: string | null;
    annotations: unknown[];
  };
  index: number;
  logprobs: unknown;
  finish_reason: string;
}

export type TStarRating = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';