import { reviewService } from '@/lib/services/reviewService';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    console.log('=== Stats API Called ===');
    console.log('Profile ID filter:', profileId);

    // Test database connection first
    try {
      const testCollection = await reviewService['getCollection']('reviews');
      const testCount = await testCollection.countDocuments();
      console.log('Database connection test - Document count:', testCount);

      if (testCount === 0) {
        console.log('No documents found in reviews collection');
        return NextResponse.json({
          dashboardStats: {
            totalReviews: 0,
            pendingReplies: 0,
            averageRating: 0,
            responseRate: 0,
            reviewTrends: [],
            ratingDistribution: [],
            lastUpdated: new Date(),
          },
          profileStats: [],
        });
      }

      // Get a sample document to check structure
      const sampleDoc = await testCollection.findOne();
      console.log('Sample document keys:', Object.keys(sampleDoc || {}));
      console.log('Sample businessProfileId type:', typeof sampleDoc?.businessProfileId);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      throw new Error(
        `Database connection failed: ${
          dbError instanceof Error ? dbError.message : 'Unknown error'
        }`,
      );
    }

    console.log('Fetching dashboard stats...');
    // Pass profileId to getDashboardStats
    const dashboardStats = await reviewService.getDashboardStats(profileId);
    console.log('Dashboard stats fetched:', dashboardStats);

    console.log('Fetching profile stats...');
    const profileStats = await reviewService.getProfileStats();
    console.log('Profile stats fetched:', profileStats);

    // The dashboardStats are now already filtered if profileId was provided.
    // The profileStats are for all profiles, used for the dropdown.
    // No need for client-side filtering of dashboardStats here.

    console.log('=== Stats API Success ===');
    return NextResponse.json({
      dashboardStats,
      profileStats,
    });
  } catch (error) {
    console.error('=== Stats API Error ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/stats',
          profileIdRequested: request.nextUrl.searchParams.get('profileId'),
        },
      },
      { status: 500 },
    );
  }
}
