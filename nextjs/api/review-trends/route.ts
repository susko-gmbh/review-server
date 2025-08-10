import { reviewService } from '@/lib/services/reviewService';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as '7d' | '30d' | '3m' | '12m') || '30d';
    const profileId = searchParams.get('profileId');

    console.log('=== Review Trends API Called ===');
    console.log('Period:', period, 'Profile ID:', profileId);

    // Validate period parameter
    if (!['7d', '30d', '3m', '12m'].includes(period)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid period. Must be one of: 7d, 30d, 3m, 12m',
        },
        { status: 400 },
      );
    }

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
      case '12m':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    console.log('Fetching review trends from', startDate, 'to', now);

    const reviewTrends = await reviewService.getReviewTrends(startDate, now, period, profileId);

    console.log('Review trends fetched:', reviewTrends.length, 'data points');

    return NextResponse.json({
      success: true,
      data: reviewTrends,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      metadata: {
        totalDataPoints: reviewTrends.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('=== Review Trends API Error ===');
    console.error('Error details:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch review trends',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
          period: request.nextUrl.searchParams.get('period'),
          profileId: request.nextUrl.searchParams.get('profileId'),
        },
      },
      { status: 500 },
    );
  }
}
