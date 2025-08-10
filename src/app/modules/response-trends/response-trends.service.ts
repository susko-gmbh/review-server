import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { Review } from '../review/review.model';
import { RESPONSE_TRENDS_MESSAGES } from './response-trends.constant';
import { TResponseTrendData, TResponseTrendsPeriod } from './response-trends.interface';

// Import the review service functionality
// Note: This would need to be adapted to use your actual database connection
class ResponseTrendsServiceClass {

  async getResponseTrends(
    period: TResponseTrendsPeriod = '30d',
    profileId?: string
  ): Promise<TResponseTrendData[]> {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Build the aggregation pipeline
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              $lte: now,
            },
          },
        }
      );

      // Add grouping logic based on period
      if (period === '7d') {
        pipeline.push({
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$reviews.createDate',
              },
            },
            totalReviews: { $sum: 1 },
            repliedReviews: {
              $sum: { $cond: ['$reviews.hasReply', 1, 0] },
            },
            avgResponseTime: {
              $avg: {
                $cond: [
                  '$reviews.hasReply',
                  {
                    $divide: [
                      { $subtract: ['$reviews.replyDate', '$reviews.createDate'] },
                      3600000, // Convert to hours
                    ],
                  },
                  null,
                ],
              },
            },
          },
        });
      } else {
        // For 30d and 3m, group by week
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$reviews.createDate' },
              week: { $week: '$reviews.createDate' },
            },
            totalReviews: { $sum: 1 },
            repliedReviews: {
              $sum: { $cond: ['$reviews.hasReply', 1, 0] },
            },
            avgResponseTime: {
              $avg: {
                $cond: [
                  '$reviews.hasReply',
                  {
                    $divide: [
                      { $subtract: ['$reviews.replyDate', '$reviews.createDate'] },
                      3600000,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        });
      }

      pipeline.push({ $sort: { _id: 1 } });

      const results = await Review.aggregate(pipeline);

      // Transform results to match the expected format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trends: TResponseTrendData[] = results.map((result: Record<string, any>) => {
        const replyRate = result.totalReviews > 0 
          ? (result.repliedReviews / result.totalReviews) * 100 
          : 0;
        
        let dateStr: string;
        let periodStr: string;
        
        if (period === '7d') {
          dateStr = result._id;
          periodStr = result._id;
        } else {
          const weekDate = this.getDateFromWeek(result._id.year, result._id.week);
          dateStr = weekDate.toISOString().split('T')[0];
          periodStr = `Week ${result._id.week}, ${result._id.year}`;
        }

        return {
          period: periodStr,
          responseTime: Math.round((result.avgResponseTime || 0) * 10) / 10,
          replyRate: Math.round(replyRate * 10) / 10,
          date: dateStr,
          totalReviews: result.totalReviews,
          repliedReviews: result.repliedReviews,
        };
      });

      return this.fillMissingPeriods(trends, startDate, now, period);
    } catch (error) {
      console.error('Error in getResponseTrends:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        RESPONSE_TRENDS_MESSAGES.FETCH_ERROR
      );
    }
  }

  private getDateFromWeek(year: number, week: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    return new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private fillMissingPeriods(
    trends: TResponseTrendData[],
    startDate: Date,
    endDate: Date,
    period: TResponseTrendsPeriod
  ): TResponseTrendData[] {
    const filledTrends: TResponseTrendData[] = [];

    if (period === '7d') {
      // Fill daily gaps
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = trends.find(t => t.date === dateStr);
        
        if (existing) {
          filledTrends.push(existing);
        } else {
          filledTrends.push({
            period: dateStr,
            responseTime: 0,
            replyRate: 0,
            date: dateStr,
            totalReviews: 0,
            repliedReviews: 0,
          });
        }
      }
    } else {
      // Fill weekly gaps
      const current = new Date(startDate);
      while (current <= endDate) {
        const weekNumber = this.getWeekNumber(current);
        const year = current.getFullYear();
        const weekDate = this.getDateFromWeek(year, weekNumber);
        const dateStr = weekDate.toISOString().split('T')[0];
        
        const existing = trends.find(t => t.date === dateStr);
        if (existing) {
          filledTrends.push(existing);
        } else {
          filledTrends.push({
            period: `Week ${weekNumber}, ${year}`,
            responseTime: 0,
            replyRate: 0,
            date: dateStr,
            totalReviews: 0,
            repliedReviews: 0,
          });
        }
        
        current.setDate(current.getDate() + 7);
      }
    }

    return filledTrends;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

export const ResponseTrendsService = new ResponseTrendsServiceClass();