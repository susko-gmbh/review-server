import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../error/AppError';
import { REVIEW_MESSAGES } from './review.constant';
import { TCreateReview, TReview, TReviewQuery, TUpdateReview } from './review.interface';
import { Review } from './review.model';

class ReviewServiceClass {
  async getAllReviews(filters: TReviewQuery) {
    try {
      const {
        profileId,
        status,
        rating,
        search = '',
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
        reviews: reviews.map(review => ({
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
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid review ID format');
      }

      const review = await Review.findById(id).lean();
      
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
      const existingReview = await Review.findOne({ reviewId: reviewData.reviewId });
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

  async getReviewsByBusinessProfileId(businessProfileId: string): Promise<TReview[]> {
    try {
      const reviews = await Review.find({
        $or: [
          { businessProfileId },
          { businessProfileId: Number(businessProfileId) },
        ],
      })
        .sort({ createTime: -1 })
        .lean();

      return reviews.map(review => ({
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

  async getRecentReviews(limit: number = 4, profileId?: string): Promise<TReview[]> {
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

      return reviews.map(review => ({
        ...review,
        _id: review._id?.toString(),
      })) as TReview[];
    } catch (error) {
      console.error('Error in getRecentReviews:', error);
      return [];
    }
  }
}

export const ReviewService = new ReviewServiceClass();