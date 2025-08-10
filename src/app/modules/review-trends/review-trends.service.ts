import { StatusCodes } from 'http-status-codes';
import AppError from '../../error/AppError';
import { Review } from '../review/review.model';
import { REVIEW_TRENDS_MESSAGES } from './review-trends.constant';
import { TReviewTrendData, TReviewTrendsPeriod } from './review-trends.interface';

class ReviewTrendsServiceClass {

  async getReviewTrends(
    period: TReviewTrendsPeriod = '30d',
    profileId?: string
  ): Promise<TReviewTrendData[]> {
    try {
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
        case '12m':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
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
        {
          $addFields: {
            createDate: {
              $dateFromString: {
                dateString: '$createTime',
                onError: new Date(),
              },
            },
          },
        },
        {
          $match: {
            createDate: {
              $gte: startDate,
              $lte: now,
            },
          },
        }
      );

      // Group by period
      if (period === '7d') {
        pipeline.push({
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createDate',
              },
            },
            count: { $sum: 1 },
          },
        });
      } else if (period === '30d') {
        pipeline.push({
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createDate',
              },
            },
            count: { $sum: 1 },
          },
        });
      } else if (period === '3m') {
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$createDate' },
              week: { $week: '$createDate' },
            },
            count: { $sum: 1 },
          },
        });
      } else if (period === '12m') {
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$createDate' },
              month: { $month: '$createDate' },
            },
            count: { $sum: 1 },
          },
        });
      }

      pipeline.push({ $sort: { _id: 1 } });

      const results = await Review.aggregate(pipeline);

      // Transform results to match the expected format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trends: TReviewTrendData[] = results.map((result: Record<string, any>) => {
        let dateStr: string;
        let periodStr: string;
        
        if (period === '7d' || period === '30d') {
          dateStr = result._id;
          periodStr = result._id;
        } else if (period === '3m') {
          const weekDate = this.getDateFromWeek(result._id.year, result._id.week);
          dateStr = weekDate.toISOString().split('T')[0];
          periodStr = `Week ${result._id.week}, ${result._id.year}`;
        } else if (period === '12m') {
          const monthDate = new Date(result._id.year, result._id.month - 1, 1);
          dateStr = monthDate.toISOString().split('T')[0];
          periodStr = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } else {
          dateStr = result._id;
          periodStr = result._id;
        }

        return {
          period: periodStr,
          count: result.count,
          date: dateStr,
        };
      });

      return this.fillMissingReviewPeriods(trends, startDate, now, period);
    } catch (error) {
      console.error('Error in getReviewTrends:', error);
      throw new AppError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        REVIEW_TRENDS_MESSAGES.FETCH_ERROR
      );
    }
  }

  private getDateFromWeek(year: number, week: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    return new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private fillMissingReviewPeriods(
    trends: TReviewTrendData[],
    startDate: Date,
    endDate: Date,
    period: TReviewTrendsPeriod
  ): TReviewTrendData[] {
    const filledTrends: TReviewTrendData[] = [];

    if (period === '7d' || period === '30d') {
      // Fill daily gaps
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = trends.find(t => t.date === dateStr);
        
        if (existing) {
          filledTrends.push(existing);
        } else {
          filledTrends.push({
            period: dateStr,
            count: 0,
            date: dateStr,
          });
        }
      }
    } else if (period === '3m') {
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
            count: 0,
            date: dateStr,
          });
        }
        
        current.setDate(current.getDate() + 7);
      }
    } else if (period === '12m') {
      // Fill monthly gaps
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const periodStr = current.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        const existing = trends.find(t => t.date === dateStr);
        if (existing) {
          filledTrends.push(existing);
        } else {
          filledTrends.push({
            period: periodStr,
            count: 0,
            date: dateStr,
          });
        }
        
        current.setMonth(current.getMonth() + 1);
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

export const ReviewTrendsService = new ReviewTrendsServiceClass();