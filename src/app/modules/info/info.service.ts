import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { Review } from '../review/review.model';
import { TReview } from '../review/review.interface';
import { INFO_MESSAGES } from './info.constant';
import { TBusinessInfo, TBusinessInfoQuery } from './info.interface';

const getBusinessInfo = async (
  businessProfileId: string,
  options: TBusinessInfoQuery = {}
): Promise<TBusinessInfo> => {
  try {
    console.log('Fetching business info for:', businessProfileId);

    // Check if business profile exists
    const businessExists = await Review.findOne({ businessProfileId });
    if (!businessExists) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        INFO_MESSAGES.NOT_FOUND
      );
    }

    // Get business profile name
    const businessProfileName = businessExists.businessProfileName;

    // Aggregate business statistics
    const pipeline = [
      {
        $match: {
          businessProfileId: businessProfileId,
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          pendingReplies: {
            $sum: {
              $cond: [{ $eq: ['$replyStatus', 'pending'] }, 1, 0],
            },
          },
          repliedReviews: {
            $sum: {
              $cond: [{ $eq: ['$replyStatus', 'replied'] }, 1, 0],
            },
          },
          averageRating: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$starRating', 'ONE'] }, then: 1 },
                  { case: { $eq: ['$starRating', 'TWO'] }, then: 2 },
                  { case: { $eq: ['$starRating', 'THREE'] }, then: 3 },
                  { case: { $eq: ['$starRating', 'FOUR'] }, then: 4 },
                  { case: { $eq: ['$starRating', 'FIVE'] }, then: 5 },
                ],
                default: 0,
              },
            },
          },
          allReviews: { $push: '$$ROOT' },
        },
      },
    ];

    const [stats] = await Review.aggregate(pipeline);

    if (!stats) {
      return {
        businessProfileId,
        businessProfileName,
        totalReviews: 0,
        averageRating: 0,
        pendingReplies: 0,
        responseRate: 0,
        lastReviewDate: null,
        firstReviewDate: null,
        ratingDistribution: [],
        recentReviews: [],
      };
    }

    // Calculate response rate
    const responseRate = stats.totalReviews > 0 
      ? (stats.repliedReviews / stats.totalReviews) * 100 
      : 0;

    // Calculate rating distribution
    const ratingDistribution = stats.allReviews.reduce(
      (acc: Record<number, number>, review: TReview) => {
        const ratingMap: Record<string, number> = {
          ONE: 1,
          TWO: 2,
          THREE: 3,
          FOUR: 4,
          FIVE: 5,
        };
        const rating = ratingMap[review.starRating] || 0;
        
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      {}
    );

    const ratingDistributionArray = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratingDistribution[rating] || 0,
    }));

    // Get first and last review dates
    const sortedReviews = stats.allReviews.sort(
      (a: TReview, b: TReview) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
    );
    
    const firstReviewDate = sortedReviews.length > 0 ? sortedReviews[0].createTime : null;
    const lastReviewDate = sortedReviews.length > 0 
      ? sortedReviews[sortedReviews.length - 1].createTime 
      : null;

    // Get recent reviews if requested
    let recentReviews: TBusinessInfo['recentReviews'] = [];
    if (options.includeRecentReviews) {
      const limit = options.recentReviewsLimit || 5;
      const recentReviewsData = await Review.find({ businessProfileId })
        .sort({ createTime: -1 })
        .limit(limit)
        .select('reviewId starRating comment createTime reviewer')
        .lean();

      recentReviews = recentReviewsData.map((review) => ({
        reviewId: review.reviewId,
        starRating: review.starRating,
        comment: review.comment || '',
        createTime: review.createTime,
        reviewer: {
          displayName: review.reviewer.displayName,
          profilePhotoUrl: review.reviewer.profilePhotoUrl,
        },
      }));
    }

    const businessInfo: TBusinessInfo = {
      businessProfileId,
      businessProfileName,
      totalReviews: stats.totalReviews,
      averageRating: Math.round(stats.averageRating * 10) / 10,
      pendingReplies: stats.pendingReplies,
      responseRate: Math.round(responseRate * 10) / 10,
      lastReviewDate,
      firstReviewDate,
      ratingDistribution: ratingDistributionArray,
      recentReviews,
    };

    console.log('Business info calculated successfully:', businessInfo);
    return businessInfo;
  } catch (error) {
    console.error('Error in getBusinessInfo:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      INFO_MESSAGES.FETCH_ERROR
    );
  }
};

const getAllProfilesSummary = async () => {
  try {
    console.log('Fetching all profiles summary');

    // Aggregate all business profiles with their review counts
    const pipeline = [
      {
        $group: {
          _id: {
            businessProfileId: '$businessProfileId',
            businessProfileName: '$businessProfileName',
          },
          totalReviews: { $sum: 1 },
          pendingReplies: {
            $sum: {
              $cond: [{ $eq: ['$replyStatus', 'pending'] }, 1, 0],
            },
          },
          repliedReviews: {
            $sum: {
              $cond: [{ $eq: ['$replyStatus', 'replied'] }, 1, 0],
            },
          },
          averageRating: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$starRating', 'ONE'] }, then: 1 },
                  { case: { $eq: ['$starRating', 'TWO'] }, then: 2 },
                  { case: { $eq: ['$starRating', 'THREE'] }, then: 3 },
                  { case: { $eq: ['$starRating', 'FOUR'] }, then: 4 },
                  { case: { $eq: ['$starRating', 'FIVE'] }, then: 5 },
                ],
                default: 0,
              },
            },
          },
          lastReviewDate: { $max: '$createTime' },
          firstReviewDate: { $min: '$createTime' },
        },
      },
      {
        $project: {
          _id: 0,
          businessProfileId: '$_id.businessProfileId',
          businessProfileName: '$_id.businessProfileName',
          totalReviews: 1,
          pendingReplies: 1,
          repliedReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          responseRate: {
            $round: [
              {
                $cond: [
                  { $gt: ['$totalReviews', 0] },
                  { $multiply: [{ $divide: ['$repliedReviews', '$totalReviews'] }, 100] },
                  0,
                ],
              },
              1,
            ],
          },
          lastReviewDate: 1,
          firstReviewDate: 1,
        },
      },
      {
        $sort: { totalReviews: -1 as -1 },
      },
    ];

    const profiles = await Review.aggregate(pipeline);

    // Calculate overall statistics
    const totalProfiles = profiles.length;
    const totalReviewsAcrossAllProfiles = profiles.reduce(
      (sum, profile) => sum + profile.totalReviews,
      0
    );
    const totalPendingReplies = profiles.reduce(
      (sum, profile) => sum + profile.pendingReplies,
      0
    );
    const overallAverageRating = profiles.length > 0
      ? Math.round(
          (profiles.reduce((sum, profile) => sum + profile.averageRating, 0) /
            profiles.length) *
            10
        ) / 10
      : 0;

    const summary = {
      totalProfiles,
      totalReviews: totalReviewsAcrossAllProfiles,
      totalPendingReplies,
      overallAverageRating,
      profiles,
    };

    console.log('All profiles summary calculated successfully:', {
      totalProfiles,
      totalReviews: totalReviewsAcrossAllProfiles,
    });
    
    return summary;
  } catch (error) {
    console.error('Error in getAllProfilesSummary:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      INFO_MESSAGES.FETCH_ERROR
    );
  }
};

export const InfoService = {
  getBusinessInfo,
  getAllProfilesSummary,
};