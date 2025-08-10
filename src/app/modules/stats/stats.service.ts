/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { Review } from '../review/review.model';
import { STATS_MESSAGES } from './stats.constant';
import {
  TDashboardStats,
  TFilteredStats,
  TFilteredStatsQuery,
  TProfileStats,
} from './stats.interface';

class StatsServiceClass {
  async getDashboardStats(profileId?: string): Promise<TDashboardStats> {
    try {
      console.log('Calculating dashboard stats for profileId:', profileId);

      // Build the aggregation pipeline

      const pipeline: any[] = [];

      // Add profile filter if specified
      if (profileId && profileId !== 'all') {
        pipeline.push({
          $match: {
            $or: [
              { businessProfileId: profileId },
              { businessProfileName: profileId },
              { businessProfileId: Number(profileId) },
            ],
          },
        });
      }

      pipeline.push(
        {
          $addFields: {
            hasReply: {
              $and: [
                { $ne: ['$reviewReply', null] },
                { $ne: ['$reviewReply.comment', null] },
                { $ne: ['$reviewReply.comment', ''] },
              ],
            },
            numericRating: {
              $switch: {
                branches: [
                  { case: { $eq: ['$starRating', 'ONE'] }, then: 1 },
                  { case: { $eq: ['$starRating', 'TWO'] }, then: 2 },
                  { case: { $eq: ['$starRating', 'THREE'] }, then: 3 },
                  { case: { $eq: ['$starRating', 'FOUR'] }, then: 4 },
                  { case: { $eq: ['$starRating', 'FIVE'] }, then: 5 },
                ],
                default: 3,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            pendingReplies: {
              $sum: { $cond: [{ $eq: ['$hasReply', false] }, 1, 0] },
            },
            repliedReviews: {
              $sum: { $cond: [{ $eq: ['$hasReply', true] }, 1, 0] },
            },
            averageRating: { $avg: '$numericRating' },
            allReviews: { $push: '$$ROOT' },
            ratingCounts: {
              $push: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$starRating', 'ONE'] }, then: 1 },
                    { case: { $eq: ['$starRating', 'TWO'] }, then: 2 },
                    { case: { $eq: ['$starRating', 'THREE'] }, then: 3 },
                    { case: { $eq: ['$starRating', 'FOUR'] }, then: 4 },
                    { case: { $eq: ['$starRating', 'FIVE'] }, then: 5 },
                  ],
                  default: 3,
                },
              },
            },
          },
        }
      );

      const result = await Review.aggregate(pipeline);
      const stats = result[0] || {
        totalReviews: 0,
        pendingReplies: 0,
        repliedReviews: 0,
        averageRating: 0,
        allReviews: [],
        ratingCounts: [],
      };

      // Calculate rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: stats.ratingCounts.filter((r: number) => r === rating).length,
      }));

      // Calculate response rate
      const responseRate =
        stats.totalReviews > 0
          ? (stats.repliedReviews / stats.totalReviews) * 100
          : 0;

      // Calculate review trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const reviewTrends = stats.allReviews
        .filter((review: any) => new Date(review.createTime) >= sixMonthsAgo)
        .reduce(
          (
            acc: Record<string, number>,
            review: { createTime: string | Date }
          ) => {
            const date = new Date(review.createTime);
            const monthKey = date.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            acc[monthKey] = (acc[monthKey] || 0) + 1;
            return acc;
          },
          {}
        );

      const reviewTrendsArray = Object.entries(reviewTrends).map(
        ([month, count]) => ({
          month,
          count: count as number,
        })
      );

      const dashboardStats: TDashboardStats = {
        totalReviews: stats.totalReviews,
        pendingReplies: stats.pendingReplies,
        averageRating: Math.round(stats.averageRating * 10) / 10,
        responseRate: Math.round(responseRate * 10) / 10,
        reviewTrends: reviewTrendsArray,
        ratingDistribution,
        lastUpdated: new Date(),
      };

      console.log('Dashboard stats calculated successfully:', dashboardStats);
      return dashboardStats;
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        totalReviews: 0,
        pendingReplies: 0,
        averageRating: 0,
        responseRate: 0,
        reviewTrends: [],
        ratingDistribution: [],
        lastUpdated: new Date(),
      };
    }
  }

  async getProfileStats(): Promise<TProfileStats[]> {
    try {
      console.log('Calculating profile stats...');

      const pipeline = [
        {
          $addFields: {
            hasReply: {
              $and: [
                { $ne: ['$reviewReply', null] },
                { $ne: ['$reviewReply.comment', null] },
                { $ne: ['$reviewReply.comment', ''] },
              ],
            },
            numericRating: {
              $switch: {
                branches: [
                  { case: { $eq: ['$starRating', 'ONE'] }, then: 1 },
                  { case: { $eq: ['$starRating', 'TWO'] }, then: 2 },
                  { case: { $eq: ['$starRating', 'THREE'] }, then: 3 },
                  { case: { $eq: ['$starRating', 'FOUR'] }, then: 4 },
                  { case: { $eq: ['$starRating', 'FIVE'] }, then: 5 },
                ],
                default: 3,
              },
            },
          },
        },
        {
          $group: {
            _id: {
              profileId: { $toString: '$businessProfileId' },
              profileName: '$businessProfileName',
            },
            totalReviews: { $sum: 1 },
            pendingReplies: {
              $sum: { $cond: [{ $eq: ['$hasReply', false] }, 1, 0] },
            },
            repliedReviews: {
              $sum: { $cond: [{ $eq: ['$hasReply', true] }, 1, 0] },
            },
            averageRating: { $avg: '$numericRating' },
            lastReviewDate: { $max: '$createTime' },
          },
        },
        {
          $addFields: {
            responseRate: {
              $cond: [
                { $eq: ['$totalReviews', 0] },
                0,
                {
                  $multiply: [
                    { $divide: ['$repliedReviews', '$totalReviews'] },
                    100,
                  ],
                },
              ],
            },
          },
        },
      ];

      const result = await Review.aggregate(pipeline);
      console.log('Profile stats raw result:', result);

      const profileStats: TProfileStats[] = result.map((item) => ({
        profileId: item._id.profileId,
        profileName: item._id.profileName || 'Unknown Profile',
        totalReviews: item.totalReviews,
        averageRating: Math.round(item.averageRating * 10) / 10,
        pendingReplies: item.pendingReplies,
        responseRate: Math.round(item.responseRate * 10) / 10,
        lastReviewDate: item.lastReviewDate,
      }));

      console.log('Profile stats calculated:', profileStats);
      return profileStats;
    } catch (error) {
      console.error('Error in getProfileStats:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        STATS_MESSAGES.PROFILE_FETCH_ERROR
      );
    }
  }

  async getFilteredStats(
    filters: TFilteredStatsQuery
  ): Promise<TFilteredStats> {
    try {
      const { status, rating, profileId, search } = filters;
      console.log('Calculating filtered stats with filters:', filters);

      // Build query object

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

      // Get all matching reviews
      const reviews = await Review.find(query).lean();
      const totalReviews = reviews.length;
      const pendingReplies = reviews.filter(
        (r) => r.replyStatus === 'pending'
      ).length;

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((acc, r) => {
              const ratingValue =
                r.starRating === 'ONE'
                  ? 1
                  : r.starRating === 'TWO'
                    ? 2
                    : r.starRating === 'THREE'
                      ? 3
                      : r.starRating === 'FOUR'
                        ? 4
                        : 5;
              return acc + ratingValue;
            }, 0) / reviews.length
          : 0;

      const filteredStats: TFilteredStats = {
        totalReviews,
        pendingReplies,
        averageRating: Math.round(averageRating * 10) / 10,
      };

      console.log('Filtered stats calculated:', filteredStats);
      return filteredStats;
    } catch (error) {
      console.error('Error in getFilteredStats:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        STATS_MESSAGES.FILTERED_FETCH_ERROR
      );
    }
  }
}

export const StatsService = new StatsServiceClass();
