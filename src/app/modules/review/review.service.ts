import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../error/AppError';
import { REVIEW_MESSAGES } from './review.constant';
import {
  TCreateReview,
  TReview,
  TReviewQuery,
  TUpdateReview,
} from './review.interface';
import { Review } from './review.model';

class ReviewServiceClass {
  async getAllReviews(filters: TReviewQuery) {
    try {
      const {
        profileId,
        status,
        rating,
        search = '',
        aiGenerated,
        replyStartDate,
        replyEndDate,
        page = 1,
        limit = 10,
      } = filters;

      const skip = (page - 1) * limit;

      // Build query object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: Record<string, any> = {};

      // Add profile filter
      if (profileId && profileId !== 'all') {
        query.$or = [
          { businessProfileId: profileId },
          { businessProfileName: profileId },
          { businessProfileId: Number(profileId) },
        ];
      }

      // Add status filter
      if (status) {
        query.replyStatus = status;
      }

      // Add rating filter
      if (rating) {
        query.starRating = rating;
      }

      // Add search filter
      if (search) {
        query.$text = { $search: search };
      }

      // Add AI generated filter
      if (aiGenerated !== undefined) {
        query.reviewReply = { $exists: true, $ne: null };
        query['reviewReply.aiGenerated'] = aiGenerated;
      }

      // Add reply date range filter
      if (replyStartDate || replyEndDate) {
        query.reviewReply = { ...query.reviewReply, $exists: true, $ne: null };
        const dateFilter: Record<string, string> = {};
        if (replyStartDate) {
          dateFilter.$gte = replyStartDate;
        }
        if (replyEndDate) {
          dateFilter.$lte = replyEndDate;
        }
        query['reviewReply.updateTime'] = dateFilter;
      }

      // Execute query with pagination
      const [reviews, total] = await Promise.all([
        Review.find(query)
          .sort({ createTime: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments(query),
      ]);

      return {
        reviews: reviews.map((review) => ({
          ...review,
          _id: review._id?.toString(),
        })),
        total,
      };
    } catch (error) {
      console.error('Error in getAllReviews:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_MESSAGES.FETCH_ERROR
      );
    }
  }

  async getReviewById(id: string): Promise<TReview> {
    try {
      let review;

      // First try to find by MongoDB ObjectId
      if (Types.ObjectId.isValid(id)) {
        review = await Review.findById(id).lean();
      }

      // If not found by ObjectId, try to find by reviewId field
      if (!review) {
        review = await Review.findOne({ reviewId: id }).lean();
      }

      if (!review) {
        throw new AppError(StatusCodes.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
      }

      return {
        ...review,
        _id: review._id?.toString(),
      } as TReview;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getReviewById:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_MESSAGES.FETCH_ERROR
      );
    }
  }

  async createReview(reviewData: TCreateReview): Promise<TReview> {
    try {
      // Check if review with same reviewId already exists
      const existingReview = await Review.findOne({
        reviewId: reviewData.reviewId,
      });
      if (existingReview) {
        throw new AppError(
          StatusCodes.CONFLICT,
          'Review with this ID already exists'
        );
      }

      const newReview = new Review({
        ...reviewData,
        replyStatus: 'pending',
      });

      const savedReview = await newReview.save();

      return {
        ...savedReview.toObject(),
        _id: savedReview._id?.toString(),
      } as TReview;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in createReview:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_MESSAGES.CREATE_ERROR
      );
    }
  }

  async updateReview(id: string, updateData: TUpdateReview): Promise<TReview> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid review ID format');
      }

      // Calculate response time if reply is being added
      if (updateData.reviewReply && updateData.replyStatus === 'replied') {
        const review = await Review.findById(id);
        if (review && review.createTime) {
          const createDate = new Date(review.createTime);
          const replyDate = new Date(updateData.reviewReply.updateTime);
          const responseTimeMs = replyDate.getTime() - createDate.getTime();
          updateData.responseTimeHours = responseTimeMs / (1000 * 60 * 60); // Convert to hours
        }
      }

      const updatedReview = await Review.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      if (!updatedReview) {
        throw new AppError(StatusCodes.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
      }

      return {
        ...updatedReview,
        _id: updatedReview._id?.toString(),
      } as TReview;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in updateReview:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_MESSAGES.UPDATE_ERROR
      );
    }
  }

  async deleteReview(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid review ID format');
      }

      const deletedReview = await Review.findByIdAndDelete(id);

      if (!deletedReview) {
        throw new AppError(StatusCodes.NOT_FOUND, REVIEW_MESSAGES.NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in deleteReview:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_MESSAGES.DELETE_ERROR
      );
    }
  }

  async getReviewsByBusinessProfileId(
    businessProfileId: string
  ): Promise<TReview[]> {
    try {
      const reviews = await Review.find({
        $or: [
          { businessProfileId },
          { businessProfileId: Number(businessProfileId) },
        ],
      })
        .sort({ createTime: -1 })
        .lean();

      return reviews.map((review) => ({
        ...review,
        _id: review._id?.toString(),
      })) as TReview[];
    } catch (error) {
      console.error('Error in getReviewsByBusinessProfileId:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_MESSAGES.FETCH_ERROR
      );
    }
  }

  async getRecentReviews(
    limit: number = 4,
    profileId?: string
  ): Promise<TReview[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: Record<string, any> = {};

      if (profileId && profileId !== 'all') {
        query.$or = [
          { businessProfileId: profileId },
          { businessProfileName: profileId },
          { businessProfileId: Number(profileId) },
        ];
      }

      const reviews = await Review.find(query)
        .sort({ createTime: -1 })
        .limit(limit)
        .lean();

      return reviews.map((review) => ({
        ...review,
        _id: review._id?.toString(),
      })) as TReview[];
    } catch (error) {
      console.error('Error in getRecentReviews:', error);
      return [];
    }
  }

  async getReplySummary(filters: {
    businessProfileId?: string;
    startDate?: string;
    endDate?: string;
    aiGenerated?: boolean;
    page?: number;
    limit?: number;
  }) {
    try {
      const { businessProfileId, startDate, endDate, aiGenerated, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      // Build match query for aggregation
      const matchQuery: Record<string, unknown> = {
        reviewReply: { $exists: true, $ne: null },
      };

      // Add business profile filter
      if (businessProfileId) {
        matchQuery.$or = [
          { businessProfileId: businessProfileId },
          { businessProfileName: businessProfileId },
          { businessProfileId: Number(businessProfileId) },
        ];
      }

      // Add date range filter for reviewReply.updateTime
      if (startDate || endDate) {
        const dateFilter: Record<string, string> = {};
        if (startDate) {
          dateFilter.$gte = startDate;
        }
        if (endDate) {
          dateFilter.$lte = endDate;
        }
        matchQuery['reviewReply.updateTime'] = dateFilter;
      }

      // Add AI generated filter
      if (aiGenerated !== undefined) {
        matchQuery['reviewReply.aiGenerated'] = aiGenerated;
      }

      // Get summary statistics
      const summaryPipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalReplies: { $sum: 1 },
            aiGeneratedReplies: {
              $sum: {
                $cond: [{ $eq: ['$reviewReply.aiGenerated', true] }, 1, 0],
              },
            },
            manualReplies: {
              $sum: {
                $cond: [{ $ne: ['$reviewReply.aiGenerated', true] }, 1, 0],
              },
            },
          },
        },
      ];

      // Get paginated replies with details
      const repliesPipeline = [
        { $match: matchQuery },
        {
          $project: {
            reviewId: 1,
            businessProfileId: 1,
            businessProfileName: 1,
            reviewer: 1,
            starRating: 1,
            comment: 1,
            reviewReply: 1,
            createTime: 1,
            updateTime: 1,
            replyDate: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $dateFromString: { dateString: '$reviewReply.updateTime' } },
              },
            },
          },
        },
        { $sort: { 'reviewReply.updateTime': -1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      // Get daily summary for the filtered period
      const dailySummaryPipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $dateFromString: { dateString: '$reviewReply.updateTime' } },
              },
            },
            totalReplies: { $sum: 1 },
            aiGeneratedReplies: {
              $sum: {
                $cond: [{ $eq: ['$reviewReply.aiGenerated', true] }, 1, 0],
              },
            },
            manualReplies: {
              $sum: {
                $cond: [{ $ne: ['$reviewReply.aiGenerated', true] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: -1 } },
      ];

      const [summaryResult, repliesResult, dailySummaryResult] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Review.aggregate(summaryPipeline as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Review.aggregate(repliesPipeline as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Review.aggregate(dailySummaryPipeline as any),
      ]);

      const summary = summaryResult[0] || {
        totalReplies: 0,
        aiGeneratedReplies: 0,
        manualReplies: 0,
      };

      // Get total count for pagination
      const totalCount = await Review.countDocuments(matchQuery);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        summary,
        dailySummary: dailySummaryResult,
        replies: repliesResult,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      };
    } catch {
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to fetch reply summary'
      );
    }
  }
}

export const ReviewService = new ReviewServiceClass();
