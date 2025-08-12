import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { TReviewerReply } from './reviewer-reply.interface';
import { ReviewerReply } from './reviewer-reply.model';

class ReviewerReplyServiceClass {
  async createReviewerReply(reviewerReplyData: TReviewerReply) {
    try {
      // Check if reviewer reply already exists
      const existingReply = await ReviewerReply.findOne({
        reviewId: reviewerReplyData.reviewId,
      });

      let savedReply;
      if (existingReply) {
        // Update existing reviewer reply
        savedReply = await ReviewerReply.findOneAndUpdate(
          { reviewId: reviewerReplyData.reviewId },
          reviewerReplyData,
          { new: true, runValidators: true }
        );
      } else {
        // Create new reviewer reply
        savedReply = await ReviewerReply.create(reviewerReplyData);
      }

      return savedReply;
    } catch (error) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to save reviewer reply: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getReviewerRepliesByBusinessProfile(
    businessProfileId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const { page = 1, limit = 10, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      // Build filter query
      const filter: {
        businessProfileId: string;
        createTime?: {
          $gte?: string;
          $lte?: string;
        };
      } = { businessProfileId };

      if (startDate || endDate) {
        filter.createTime = {};
        if (startDate) {
          filter.createTime.$gte = startDate;
        }
        if (endDate) {
          filter.createTime.$lte = endDate;
        }
      }

      // Get total count
      const total = await ReviewerReply.countDocuments(filter);

      // Get paginated results
      const reviewerReplies = await ReviewerReply.find(filter)
        .sort({ createTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        reviewerReplies,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to fetch reviewer replies: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getReviewerReplyById(reviewId: string) {
    try {
      const reviewerReply = await ReviewerReply.findOne({ reviewId }).lean();
      
      if (!reviewerReply) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          'Reviewer reply not found'
        );
      }

      return reviewerReply;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to fetch reviewer reply: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteReviewerReply(reviewId: string) {
    try {
      const deletedReply = await ReviewerReply.findOneAndDelete({ reviewId });
      
      if (!deletedReply) {
        throw new AppError(
          StatusCodes.NOT_FOUND,
          'Reviewer reply not found'
        );
      }

      return deletedReply;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to delete reviewer reply: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export const ReviewerReplyService = new ReviewerReplyServiceClass();