import { model, Schema } from 'mongoose';
import { TReview, TReviewer, TReviewReply } from './review.interface';

const reviewerSchema = new Schema<TReviewer>({
  profilePhotoUrl: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
}, { _id: false });

const reviewReplySchema = new Schema<TReviewReply>({
  comment: {
    type: String,
    required: true,
  },
  updateTime: {
    type: String,
    required: true,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const reviewSchema = new Schema<TReview>(
  {
    reviewId: {
      type: String,
      required: [true, 'Review ID is required'],
      unique: true,
      trim: true,
    },
    businessProfileId: {
      type: String,
      required: [true, 'Business profile ID is required'],
      trim: true,
    },
    businessProfileName: {
      type: String,
      required: [true, 'Business profile name is required'],
      trim: true,
    },
    executionTimestamp: {
      type: String,
      required: [true, 'Execution timestamp is required'],
    },
    reviewer: {
      type: reviewerSchema,
      required: [true, 'Reviewer information is required'],
    },
    starRating: {
      type: String,
      enum: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'],
      required: [true, 'Star rating is required'],
    },
    comment: {
      type: String,
      trim: true,
    },
    createTime: {
      type: String,
      required: [true, 'Create time is required'],
    },
    updateTime: {
      type: String,
      required: [true, 'Update time is required'],
    },
    reviewReply: {
      type: reviewReplySchema,
    },
    replyStatus: {
      type: String,
      enum: ['pending', 'replied', 'ignored'],
      default: 'pending',
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    responseTimeHours: {
      type: Number,
      min: 0,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
reviewSchema.index({ reviewId: 1 });
reviewSchema.index({ businessProfileId: 1 });
reviewSchema.index({ businessProfileName: 1 });
reviewSchema.index({ replyStatus: 1 });
reviewSchema.index({ starRating: 1 });
reviewSchema.index({ createTime: 1 });
reviewSchema.index({ 'reviewer.displayName': 1 });

// Text index for search functionality
reviewSchema.index({
  comment: 'text',
  'reviewer.displayName': 'text',
  businessProfileName: 'text',
});

export const Review = model<TReview>('Review', reviewSchema);