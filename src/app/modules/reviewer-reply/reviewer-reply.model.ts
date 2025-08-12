import { Schema, model } from 'mongoose';
import { TReviewerReply } from './reviewer-reply.interface';

const reviewerReplySchema = new Schema<TReviewerReply>(
  {
    reviewId: {
      type: String,
      required: true,
      unique: true,
    },
    businessProfileId: {
      type: String,
      required: true,
      index: true,
    },
    reviewer: {
      profilePhotoUrl: {
        type: String,
        required: true,
      },
      displayName: {
        type: String,
        required: true,
      },
    },
    starRating: {
      type: String,
      enum: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'],
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    createTime: {
      type: String,
      required: true,
    },
    updateTime: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    message: {
      content: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      refusal: {
        type: String,
        default: null,
      },
      annotations: {
        type: [Schema.Types.Mixed],
        default: [],
      },
    },
    index: {
      type: Number,
      required: true,
    },
    logprobs: {
      type: Schema.Types.Mixed,
      default: null,
    },
    finish_reason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create indexes for better query performance
reviewerReplySchema.index({ businessProfileId: 1, createTime: -1 });
reviewerReplySchema.index({ reviewId: 1 });

export const ReviewerReply = model<TReviewerReply>('ReviewerReply', reviewerReplySchema);