/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDatabase } from '@/lib/mongodb';
import type { DashboardStatsDocument, ProfileStatsDocument, ReviewDocument } from '@/types/review';

interface ResponseTrendData {
  period: string;
  responseTime: number;
  replyRate: number;
  date: string;
  totalReviews: number;
  repliedReviews: number;
}

export class ReviewService {
  private async getCollection(name: string) {
    try {
      const db = await getDatabase();
      return db.collection(name);
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  // New method to get recent reviews for dashboard
  async getRecentReviews(limit: number = 4, profileId?: string | null): Promise<ReviewDocument[]> {
    try {
      const result = await this.getAllReviews({ limit, skip: 0 });
      return result.reviews;
    } catch (error) {
      console.error('Error in getRecentReviews:', error);
      return [];
    }
  }

  // Add the new getResponseTrends method
  async getResponseTrends(
    startDate: Date,
    endDate: Date,
    period: '7d' | '30d' | '3m',
    profileId?: string | null,
  ): Promise<ResponseTrendData[]> {
    try {
      const collection = await this.getCollection('reviews');
      console.log('Fetching response trends for period:', period, 'profileId:', profileId);
      console.log('Date range:', startDate, 'to', endDate);

      // Build the aggregation pipeline
      const pipeline: any[] = [];

      // Add profile filter if specified, BEFORE unwind
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
        { $unwind: '$reviews' },
        {
          $addFields: {
            'reviews.createDate': {
              $dateFromString: {
                dateString: '$reviews.createTime',
                onError: null,
              },
            },
            'reviews.replyDate': {
              $cond: {
                if: { $ne: ['$reviews.reviewReply.updateTime', null] },
                then: {
                  $dateFromString: {
                    dateString: '$reviews.reviewReply.updateTime',
                    onError: null,
                  },
                },
                else: null,
              },
            },
            'reviews.hasReply': {
              $and: [
                { $ne: ['$reviews.reviewReply', null] },
                { $ne: ['$reviews.reviewReply.comment', null] },
                { $ne: ['$reviews.reviewReply.comment', ''] },
              ],
            },
          },
        },
        {
          $match: {
            'reviews.createDate': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      );

      // Group by period
      let groupByExpression: any;
      let dateFormat: string;
      switch (period) {
        case '7d':
        case '30d':
          // Group by day
          groupByExpression = {
            $dateToString: { format: '%Y-%m-%d', date: '$reviews.createDate' },
          };
          dateFormat = 'daily';
          break;
        case '3m':
          // Group by week
          groupByExpression = {
            $concat: [
              { $toString: { $year: '$reviews.createDate' } },
              '-W',
              { $toString: { $week: '$reviews.createDate' } },
            ],
          };
          dateFormat = 'weekly';
          break;
      }

      pipeline.push({
        $group: {
          _id: groupByExpression,
          totalReviews: { $sum: 1 },
          repliedReviews: {
            $sum: { $cond: [{ $eq: ['$reviews.hasReply', true] }, 1, 0] },
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $eq: ['$reviews.hasReply', true] },
                {
                  $divide: [
                    {
                      $subtract: [
                        { $ifNull: ['$reviews.replyDate', '$reviews.createDate'] },
                        '$reviews.createDate',
                      ],
                    },
                    1000 * 60 * 60, // Convert to hours
                  ],
                },
                null,
              ],
            },
          },
          reviews: { $push: '$reviews' },
        },
      });
      pipeline.push({ $sort: { _id: 1 } });

      console.log('Response trends pipeline:', JSON.stringify(pipeline, null, 2));
      const result = await collection.aggregate(pipeline).toArray();
      console.log('Raw aggregation result:', result);

      // Transform the results
      const trends: ResponseTrendData[] = result.map((item) => {
        const replyRate =
          item.totalReviews > 0 ? (item.repliedReviews / item.totalReviews) * 100 : 0;
        const responseTime = item.avgResponseTime || 0;
        let displayDate: string;
        if (period === '3m') {
          // For weekly data, convert week format to a readable date
          const [year, week] = item._id.split('-W');
          const date = this.getDateFromWeek(parseInt(year), parseInt(week));
          displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          // For daily data
          const date = new Date(item._id);
          if (period === '7d') {
            displayDate = date.toLocaleDateString('en-US', { weekday: 'short' });
          } else {
            displayDate = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
          }
        }

        return {
          period: displayDate,
          responseTime: Math.round(Math.max(0, responseTime) * 10) / 10,
          replyRate: Math.round(replyRate * 10) / 10,
          date: item._id,
          totalReviews: item.totalReviews,
          repliedReviews: item.repliedReviews,
        };
      });

      // Fill in missing dates/periods with zero values
      const filledTrends = this.fillMissingPeriods(trends, startDate, endDate, period);
      console.log('Final response trends:', filledTrends);
      return filledTrends;
    } catch (error) {
      console.error('Error in getResponseTrends:', error);
      return [];
    }
  }

  private getDateFromWeek(year: number, week: number): Date {
    const date = new Date(year, 0, 1);
    const dayOfWeek = date.getDay();
    const dayOffset = (week - 1) * 7 - dayOfWeek + 1;
    date.setDate(date.getDate() + dayOffset);
    return date;
  }

  private fillMissingPeriods(
    trends: ResponseTrendData[],
    startDate: Date,
    endDate: Date,
    period: '7d' | '30d' | '3m',
  ): ResponseTrendData[] {
    const filledData: ResponseTrendData[] = [];
    const existingData = new Map(trends.map((t) => [t.date, t]));
    const currentDate = new Date(startDate);
    let increment: number;

    switch (period) {
      case '7d':
      case '30d':
        increment = 1; // Daily
        break;
      case '3m':
        increment = 7; // Weekly
        break;
    }

    while (currentDate <= endDate) {
      let dateKey: string;
      let displayDate: string;
      if (period === '3m') {
        const year = currentDate.getFullYear();
        const week = this.getWeekNumber(currentDate);
        dateKey = `${year}-W${week}`;
        displayDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        dateKey = currentDate.toISOString().split('T')[0];
        if (period === '7d') {
          displayDate = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          displayDate = currentDate.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          });
        }
      }

      const existing = existingData.get(dateKey);
      filledData.push(
        existing || {
          period: displayDate,
          responseTime: 0,
          replyRate: 0,
          date: dateKey,
          totalReviews: 0,
          repliedReviews: 0,
        },
      );
      currentDate.setDate(currentDate.getDate() + increment);
    }
    return filledData;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  async getAllReviews(filters?: {
    profileId?: string;
    status?: string;
    rating?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ reviews: ReviewDocument[]; total: number }> {
    try {
      const collection = await this.getCollection('reviews');
      // Build aggregation pipeline to unwind the reviews array
      const pipeline: any[] = [];

      // Add profile filter if specified, BEFORE unwind
      if (filters?.profileId && filters.profileId !== 'all') {
        pipeline.push({
          $match: {
            $or: [
              { businessProfileId: filters.profileId },
              { businessProfileName: filters.profileId },
              { businessProfileId: Number(filters.profileId) }, // Handle both string and number
            ],
          },
        });
      }

      // Unwind the reviews array to get individual review documents
      pipeline.push({ $unwind: '$reviews' });

      // Add fields from the parent document to each review
      pipeline.push({
        $addFields: {
          'reviews.businessProfileId': { $toString: '$businessProfileId' },
          'reviews.businessProfileName': '$businessProfileName',
          'reviews.executionTimestamp': '$executionTimestamp',
          'reviews.replyStatus': {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$reviews.reviewReply', null] },
                  { $ne: ['$reviews.reviewReply.comment', null] },
                  { $ne: ['$reviews.reviewReply.comment', ''] },
                ],
              },
              then: 'replied',
              else: 'pending',
            },
          },
        },
      });

      // Replace root with the review document
      pipeline.push({ $replaceRoot: { newRoot: '$reviews' } });

      // Add filters to the pipeline
      const matchConditions: any = {};
      if (filters?.status && filters.status !== 'all') {
        matchConditions.replyStatus = filters.status;
      }
      if (filters?.rating && filters.rating !== 'all') {
        matchConditions.starRating = filters.rating;
      }
      if (filters?.search) {
        const searchConditions = [
          { comment: { $regex: filters.search, $options: 'i' } },
          { 'reviewer.displayName': { $regex: filters.search, $options: 'i' } },
          { businessProfileName: { $regex: filters.search, $options: 'i' } },
        ];
        matchConditions.$and = matchConditions.$and
          ? [...matchConditions.$and, { $or: searchConditions }]
          : [{ $or: searchConditions }];
      }

      // Add match stage if we have conditions
      if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
      }

      // Add sorting
      pipeline.push({ $sort: { createTime: -1 } });

      console.log('Aggregation Pipeline:', JSON.stringify(pipeline, null, 2));

      // Get total count
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await collection.aggregate(countPipeline).toArray();
      const total = countResult[0]?.total || 0;

      // Add pagination
      if (filters?.skip) {
        pipeline.push({ $skip: filters.skip });
      }
      if (filters?.limit) {
        pipeline.push({ $limit: filters.limit });
      }

      // Execute the aggregation
      const reviews = (await collection.aggregate(pipeline).toArray()) as ReviewDocument[];
      console.log(`Found ${reviews.length} reviews out of ${total} total`);
      return { reviews, total };
    } catch (error) {
      console.error('Error in getAllReviews:', error);
      throw error;
    }
  }

  async createReview(
    reviewData: Omit<ReviewDocument, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ReviewDocument> {
    try {
      const collection = await this.getCollection('reviews');
      // Check if a document with this businessProfileId already exists
      const existingDoc = await collection.findOne({
        businessProfileId: reviewData.businessProfileId,
      });

      if (existingDoc) {
        // Check if this specific review already exists in the reviews array
        const reviewExists = existingDoc.reviews?.some(
          (review: any) => review.reviewId === reviewData.reviewId,
        );

        if (reviewExists) {
          console.log(`Review ${reviewData.reviewId} already exists`);
          return reviewData as ReviewDocument;
        }

        // Add the new review to the existing document's reviews array
        await collection.updateOne(
          { businessProfileId: reviewData.businessProfileId },
          {
            $push: {
              reviews: {
                reviewId: reviewData.reviewId,
                reviewer: reviewData.reviewer,
                starRating: reviewData.starRating,
                comment: reviewData.comment,
                createTime: reviewData.createTime,
                updateTime: reviewData.updateTime,
                reviewReply: reviewData.reviewReply,
                name: reviewData.name,
              },
            } as any, // Type assertion to bypass strict typing
            $set: { updatedAt: new Date() },
          },
        );
      } else {
        // Create a new document with the review in the reviews array
        const newDoc = {
          businessProfileId: reviewData.businessProfileId,
          businessProfileName: reviewData.businessProfileName,
          executionTimestamp: reviewData.executionTimestamp,
          reviews: [
            {
              reviewId: reviewData.reviewId,
              reviewer: reviewData.reviewer,
              starRating: reviewData.starRating,
              comment: reviewData.comment,
              createTime: reviewData.createTime,
              updateTime: reviewData.updateTime,
              reviewReply: reviewData.reviewReply,
              name: reviewData.name,
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await collection.insertOne(newDoc);
      }
      return reviewData as ReviewDocument;
    } catch (error) {
      console.error('Error in createReview:', error);
      throw error;
    }
  }
  async getReviewsByBusinessProfileId(businessProfileId: string): Promise<ReviewDocument[]> {
    try {
      const collection = await this.getCollection('reviews');

      const pipeline = [
        {
          $match: {
            $or: [
              { businessProfileId: businessProfileId },
              { businessProfileId: Number(businessProfileId) },
            ],
          },
        },
        { $unwind: '$reviews' },
        {
          $addFields: {
            'reviews.businessProfileId': { $toString: '$businessProfileId' },
            'reviews.businessProfileName': '$businessProfileName',
            'reviews.executionTimestamp': '$executionTimestamp',
            'reviews.replyStatus': {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$reviews.reviewReply', null] },
                    { $ne: ['$reviews.reviewReply.comment', null] },
                    { $ne: ['$reviews.reviewReply.comment', ''] },
                  ],
                },
                then: 'replied',
                else: 'pending',
              },
            },
          },
        },
        { $replaceRoot: { newRoot: '$reviews' } },
        { $sort: { createTime: -1 } },
      ];

      const reviews = await collection.aggregate(pipeline).toArray();
      return reviews as ReviewDocument[];
    } catch (error) {
      console.error('Error in getReviewsByBusinessProfileId:', error);
      return [];
    }
  }
  async updateReview(
    reviewId: string,
    updateData: Partial<ReviewDocument>,
  ): Promise<ReviewDocument | null> {
    try {
      const collection = await this.getCollection('reviews');
      const result = await collection.findOneAndUpdate(
        { 'reviews.reviewId': reviewId },
        {
          $set: {
            'reviews.$.reviewer': updateData.reviewer,
            'reviews.$.starRating': updateData.starRating,
            'reviews.$.comment': updateData.comment,
            'reviews.$.reviewReply': updateData.reviewReply,
            'reviews.$.updateTime': updateData.updateTime || new Date().toISOString(),
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      if (result) {
        // Find and return the updated review
        const updatedReview = result.reviews?.find((review: any) => review.reviewId === reviewId);
        return updatedReview
          ? ({
              ...updatedReview,
              businessProfileId: result.businessProfileId,
              businessProfileName: result.businessProfileName,
              executionTimestamp: result.executionTimestamp,
            } as ReviewDocument)
          : null;
      }
      return null;
    } catch (error) {
      console.error('Error in updateReview:', error);
      throw error;
    }
  }

  async getDashboardStats(profileId?: string | null): Promise<DashboardStatsDocument> {
    try {
      const collection = await this.getCollection('reviews');
      console.log('Calculating dashboard stats...');

      const statsPipeline = [];

      // Add profile filter if specified, BEFORE unwind
      if (profileId && profileId !== 'all') {
        statsPipeline.push({
          $match: {
            $or: [
              { businessProfileId: profileId },
              { businessProfileName: profileId },
              { businessProfileId: Number(profileId) },
            ],
          },
        });
      }

      statsPipeline.push(
        { $unwind: '$reviews' },
        {
          $addFields: {
            'reviews.hasReply': {
              $and: [
                { $ne: ['$reviews.reviewReply', null] },
                { $ne: ['$reviews.reviewReply.comment', null] },
                { $ne: ['$reviews.reviewReply.comment', ''] },
              ],
            },
            'reviews.numericRating': {
              $switch: {
                branches: [
                  { case: { $eq: ['$reviews.starRating', 'ONE'] }, then: 1 },
                  { case: { $eq: ['$reviews.starRating', 'TWO'] }, then: 2 },
                  { case: { $eq: ['$reviews.starRating', 'THREE'] }, then: 3 },
                  { case: { $eq: ['$reviews.starRating', 'FOUR'] }, then: 4 },
                  { case: { $eq: ['$reviews.starRating', 'FIVE'] }, then: 5 },
                ],
                default: 3,
              },
            },
            'reviews.createDate': {
              $dateFromString: {
                dateString: '$reviews.createTime',
                onError: new Date(),
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            pendingReplies: {
              $sum: { $cond: [{ $eq: ['$reviews.hasReply', false] }, 1, 0] },
            },
            repliedReviews: {
              $sum: { $cond: [{ $eq: ['$reviews.hasReply', true] }, 1, 0] },
            },
            averageRating: { $avg: '$reviews.numericRating' },
            ratingDistribution: {
              $push: '$reviews.numericRating',
            },
            allReviews: { $push: '$reviews' },
          },
        },
      );

      const statsResult = await collection.aggregate(statsPipeline).toArray();
      const stats = statsResult[0];

      if (!stats) {
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

      // Calculate rating distribution
      const ratingCounts = stats.ratingDistribution.reduce((acc: any, rating: number) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {});
      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count: count as number,
      }));

      // Calculate response rate
      const responseRate =
        stats.totalReviews > 0 ? (stats.repliedReviews / stats.totalReviews) * 100 : 0;

      // Calculate review trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const reviewTrends = stats.allReviews
        .filter((review: any) => new Date(review.createTime) >= sixMonthsAgo)
        .reduce((acc: any, review: any) => {
          const date = new Date(review.createTime);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          acc[monthKey] = (acc[monthKey] || 0) + 1;
          return acc;
        }, {});

      const reviewTrendsArray = Object.entries(reviewTrends).map(([month, count]) => ({
        month,
        count: count as number,
      }));

      const dashboardStats = {
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

  async getProfileStats(): Promise<ProfileStatsDocument[]> {
    try {
      const collection = await this.getCollection('reviews');
      console.log('Calculating profile stats...');

      const pipeline = [
        { $unwind: '$reviews' },
        {
          $addFields: {
            'reviews.hasReply': {
              $and: [
                { $ne: ['$reviews.reviewReply', null] },
                { $ne: ['$reviews.reviewReply.comment', null] },
                { $ne: ['$reviews.reviewReply.comment', ''] },
              ],
            },
            'reviews.numericRating': {
              $switch: {
                branches: [
                  { case: { $eq: ['$reviews.starRating', 'ONE'] }, then: 1 },
                  { case: { $eq: ['$reviews.starRating', 'TWO'] }, then: 2 },
                  { case: { $eq: ['$reviews.starRating', 'THREE'] }, then: 3 },
                  { case: { $eq: ['$reviews.starRating', 'FOUR'] }, then: 4 },
                  { case: { $eq: ['$reviews.starRating', 'FIVE'] }, then: 5 },
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
              $sum: { $cond: [{ $eq: ['$reviews.hasReply', false] }, 1, 0] },
            },
            repliedReviews: {
              $sum: { $cond: [{ $eq: ['$reviews.hasReply', true] }, 1, 0] },
            },
            averageRating: { $avg: '$reviews.numericRating' },
            lastReviewDate: { $max: '$reviews.createTime' },
          },
        },
        {
          $addFields: {
            responseRate: {
              $cond: [
                { $eq: ['$totalReviews', 0] },
                0,
                { $multiply: [{ $divide: ['$repliedReviews', '$totalReviews'] }, 100] },
              ],
            },
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();
      console.log('Profile stats raw result:', result);

      const profileStats = result.map((item) => ({
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
      return [];
    }
  }

  // Add method to get review trends (similar to response trends but for review counts)
  async getReviewTrends(
    startDate: Date,
    endDate: Date,
    period: '7d' | '30d' | '3m' | '12m',
    profileId?: string | null,
  ): Promise<Array<{ period: string; count: number; date: string }>> {
    try {
      const collection = await this.getCollection('reviews');
      console.log('Fetching review trends for period:', period, 'profileId:', profileId);
      console.log('Date range:', startDate, 'to', endDate);

      // Build the aggregation pipeline
      const pipeline: any[] = [];

      // Add profile filter if specified, BEFORE unwind
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
        { $unwind: '$reviews' },
        {
          $addFields: {
            'reviews.createDate': {
              $dateFromString: {
                dateString: '$reviews.createTime',
                onError: null,
              },
            },
          },
        },
        {
          $match: {
            'reviews.createDate': {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
      );

      // Group by period
      let groupByExpression: any;
      switch (period) {
        case '7d':
        case '30d':
          // Group by day
          groupByExpression = {
            $dateToString: { format: '%Y-%m-%d', date: '$reviews.createDate' },
          };
          break;
        case '3m':
          // Group by week
          groupByExpression = {
            $concat: [
              { $toString: { $year: '$reviews.createDate' } },
              '-W',
              { $toString: { $week: '$reviews.createDate' } },
            ],
          };
          break;
        case '12m':
          // Group by month
          groupByExpression = {
            $dateToString: { format: '%Y-%m', date: '$reviews.createDate' },
          };
          break;
      }

      pipeline.push({
        $group: {
          _id: groupByExpression,
          count: { $sum: 1 },
        },
      });
      pipeline.push({ $sort: { _id: 1 } });

      console.log('Review trends pipeline:', JSON.stringify(pipeline, null, 2));
      const result = await collection.aggregate(pipeline).toArray();
      console.log('Raw review trends result:', result);

      // Transform the results
      const trends = result.map((item) => {
        let displayDate: string;
        switch (period) {
          case '7d':
            // For daily data in 7 days
            const date7d = new Date(item._id);
            displayDate = date7d.toLocaleDateString('en-US', { weekday: 'short' });
            break;
          case '30d':
            // For daily data in 30 days
            const date30d = new Date(item._id);
            displayDate = date30d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            break;
          case '3m':
            // For weekly data in 3 months
            const [year, week] = item._id.split('-W');
            const dateWeek = this.getDateFromWeek(parseInt(year), parseInt(week));
            displayDate = dateWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            break;
          case '12m':
            // For monthly data in 12 months
            const [yearMonth, month] = item._id.split('-');
            const dateMonth = new Date(parseInt(yearMonth), parseInt(month) - 1, 1);
            displayDate = dateMonth.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
            break;
          default:
            displayDate = item._id;
        }
        return {
          period: displayDate,
          count: item.count,
          date: item._id,
        };
      });

      // Fill in missing dates/periods with zero values
      const filledTrends = this.fillMissingReviewPeriods(trends, startDate, endDate, period);
      console.log('Final review trends:', filledTrends);
      return filledTrends;
    } catch (error) {
      console.error('Error in getReviewTrends:', error);
      return [];
    }
  }

  private fillMissingReviewPeriods(
    trends: Array<{ period: string; count: number; date: string }>,
    startDate: Date,
    endDate: Date,
    period: '7d' | '30d' | '3m' | '12m',
  ): Array<{ period: string; count: number; date: string }> {
    const filledData: Array<{ period: string; count: number; date: string }> = [];
    const existingData = new Map(trends.map((t) => [t.date, t]));
    const currentDate = new Date(startDate);
    let increment: number;

    switch (period) {
      case '7d':
      case '30d':
        increment = 1; // Daily
        break;
      case '3m':
        increment = 7; // Weekly
        break;
      case '12m':
        increment = 30; // Monthly (approximate)
        break;
    }

    while (currentDate <= endDate) {
      let dateKey: string;
      let displayDate: string;
      switch (period) {
        case '7d':
          dateKey = currentDate.toISOString().split('T')[0];
          displayDate = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case '30d':
          dateKey = currentDate.toISOString().split('T')[0];
          displayDate = currentDate.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          });
          break;
        case '3m':
          const year = currentDate.getFullYear();
          const week = this.getWeekNumber(currentDate);
          dateKey = `${year}-W${week}`;
          displayDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case '12m':
          const yearMonth = currentDate.getFullYear();
          const monthNum = currentDate.getMonth() + 1;
          dateKey = `${yearMonth}-${monthNum.toString().padStart(2, '0')}`;
          displayDate = currentDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
          break;
        default:
          dateKey = currentDate.toISOString().split('T')[0];
          displayDate = currentDate.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          });
      }

      const existing = existingData.get(dateKey);
      filledData.push(
        existing || {
          period: displayDate,
          count: 0,
          date: dateKey,
        },
      );

      // Only increment date if not 12m (handled above)
      if (period !== '12m') {
        currentDate.setDate(currentDate.getDate() + increment);
      }
    }
    return filledData;
  }
}

export const reviewService = new ReviewService();
