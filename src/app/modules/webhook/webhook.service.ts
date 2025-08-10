import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { Review } from '../review/review.model';
import { TReview, TStarRating } from '../review/review.interface';

// Interface for the n8n webhook data format
interface TWebhookReviewData {
  businessProfileId: number;
  businessProfileName: string;
  executionTimestamp: string;
  reviews: {
    reviewId: string;
    reviewer: {
      profilePhotoUrl: string;
      displayName: string;
    };
    starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
    comment: string;
    createTime: string;
    updateTime: string;
    reviewReply?: {
      comment: string;
      updateTime: string;
    };
    name: string;
  }[];
}

class WebhookServiceClass {
  async processReviewData(webhookData: TWebhookReviewData) {
    try {
      if (!webhookData || !webhookData.reviews || !Array.isArray(webhookData.reviews)) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Invalid webhook data format. Expected reviews array.'
        );
      }

      const processedReviews = [];
      const errors = [];

      for (const reviewData of webhookData.reviews) {
        try {
          // Transform the webhook data to match our review schema
          const transformedReview: Partial<TReview> = {
            reviewId: reviewData.reviewId,
            businessProfileId: webhookData.businessProfileId.toString(),
            businessProfileName: webhookData.businessProfileName,
            executionTimestamp: webhookData.executionTimestamp,
            reviewer: {
              profilePhotoUrl: reviewData.reviewer.profilePhotoUrl,
              displayName: reviewData.reviewer.displayName,
            },
            starRating: reviewData.starRating as TStarRating,
            comment: reviewData.comment,
            createTime: reviewData.createTime,
            updateTime: reviewData.updateTime,
            name: reviewData.name,
            // Set default values for fields not in webhook
            replyStatus: reviewData.reviewReply ? 'replied' : 'pending',
            sentimentScore: this.calculateSentimentScore(reviewData.comment, reviewData.starRating),
            responseTimeHours: reviewData.reviewReply ? this.calculateResponseTime(reviewData.createTime, reviewData.reviewReply.updateTime) : undefined,
          };

          // Add review reply if exists
          if (reviewData.reviewReply) {
            transformedReview.reviewReply = {
              comment: reviewData.reviewReply.comment,
              updateTime: reviewData.reviewReply.updateTime,
            };
          }

          // Check if review already exists
          const existingReview = await Review.findOne({ reviewId: reviewData.reviewId });
          
          let savedReview;
          if (existingReview) {
            // Update existing review
            savedReview = await Review.findOneAndUpdate(
              { reviewId: reviewData.reviewId },
              transformedReview,
              { new: true, runValidators: true }
            );
          } else {
            // Create new review
            savedReview = await Review.create(transformedReview);
          }

          if (savedReview) {
            processedReviews.push(savedReview);
          }
        } catch (reviewError) {
          errors.push({
            reviewId: reviewData.reviewId,
            error: reviewError instanceof Error ? reviewError.message : 'Unknown error',
          });
        }
      }

      return {
        success: true,
        processedCount: processedReviews.length,
        errorCount: errors.length,
        processedReviews: processedReviews.map(review => ({
          reviewId: review?.reviewId,
          starRating: review?.starRating,
          businessProfileName: review?.businessProfileName,
        })),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to process webhook data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private calculateSentimentScore(comment: string, starRating: string): number {
    // Simple sentiment calculation based on star rating and comment length
    // This is a basic implementation - you might want to use a proper sentiment analysis library
    const starRatingMap = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
    const numericRating = starRatingMap[starRating as keyof typeof starRatingMap] || 3;
    let baseScore = (numericRating - 1) / 4; // Normalize to 0-1 range
    
    // Adjust based on comment content (very basic)
    const positiveWords = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'perfect', 'love', 'best'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'bad', 'poor', 'disappointing'];
    
    const lowerComment = comment.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerComment.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerComment.includes(word)).length;
    
    // Adjust score based on word sentiment
    baseScore += (positiveCount * 0.1) - (negativeCount * 0.1);
    
    // Ensure score stays within 0-1 range
    return Math.max(0, Math.min(1, baseScore));
  }

  private calculateResponseTime(createTime: string, replyTime: string): number {
    const created = new Date(createTime);
    const replied = new Date(replyTime);
    const diffMs = replied.getTime() - created.getTime();
    return Math.round(diffMs / (1000 * 60 * 60)); // Convert to hours
  }
}

export const WebhookService = new WebhookServiceClass();