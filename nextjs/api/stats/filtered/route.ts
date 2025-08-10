import { reviewService } from '@/lib/services/reviewService';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    const profileId = searchParams.get('profileId');
    const search = searchParams.get('search');

    console.log('=== Filtered Stats API Called ===');
    console.log('Filters:', { status, rating, profileId, search });

    // Get all reviews with filters applied (no pagination limit for stats)
    const result = await reviewService.getAllReviews({
      status: status || undefined,
      rating: rating || undefined,
      profileId: profileId || undefined,
      search: search || undefined,
      limit: 50000, // Large limit to get all matching reviews
      skip: 0,
    });

    const reviews = result.reviews;
    const totalReviews = result.total;
    const pendingReplies = reviews.filter((r) => r.replyStatus === 'pending').length;

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, r) => {
            const rating =
              r.starRating === 'ONE'
                ? 1
                : r.starRating === 'TWO'
                ? 2
                : r.starRating === 'THREE'
                ? 3
                : r.starRating === 'FOUR'
                ? 4
                : 5;
            return acc + rating;
          }, 0) / reviews.length
        : 0;

    console.log('Filtered stats calculated:', {
      totalReviews,
      pendingReplies,
      averageRating: Math.round(averageRating * 10) / 10,
    });

    return NextResponse.json({
      success: true,
      totalReviews,
      pendingReplies,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error) {
    console.error('=== Filtered Stats API Error ===');
    console.error('Error details:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch filtered stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
