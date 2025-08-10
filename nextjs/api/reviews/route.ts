import { reviewService } from '@/lib/services/reviewService';
import { ReviewDocument } from '@/types/review';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search') || '';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50); // Limit max items to prevent large responses
    const skip = (page - 1) * limit;

    const result = await reviewService.getAllReviews({
      profileId: profileId || undefined,
      status: status || undefined,
      rating: rating || undefined,
      search,
      limit,
      skip,
    });

    // Optimize response size by removing unnecessary fields for large datasets
    const optimizedReviews = result.reviews.map((review) => ({
      ...review,
      // Keep only essential fields to reduce response size
      _id: review._id?.toString(), // Convert ObjectId to string
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          reviews: optimizedReviews,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0', // Prevent caching of large responses
        },
      },
    );
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received review data:', body);

    // Handle case where client sends an array of business profiles with reviews
    if (Array.isArray(body)) {
      const results = [];

      for (const businessProfile of body) {
        if (!businessProfile.reviews || !Array.isArray(businessProfile.reviews)) {
          continue;
        }

        const businessProfileId = businessProfile.businessProfileId.toString();

        // Check if any reviews already exist for this businessProfileId
        const existingReviews = await reviewService.getReviewsByBusinessProfileId(
          businessProfileId,
        );
        const existingReviewIds = new Set(existingReviews.map((r) => r.reviewId));

        const reviewsToProcess = [];
        let newReviewsCount = 0;
        let updatedReviewsCount = 0;

        for (const review of businessProfile.reviews) {
          if (existingReviewIds.has(review.reviewId)) {
            // Update existing review
            const reviewData: Partial<ReviewDocument> = {
              starRating: review.starRating,
              comment: review.comment || '',
              updateTime: review.updateTime,
              reviewReply: review.reviewReply,
              replyStatus: review.reviewReply ? 'replied' : 'pending',
            };
            await reviewService.updateReview(review.reviewId, reviewData);
            updatedReviewsCount++;
          } else {
            // Create new review
            const reviewData: ReviewDocument = {
              reviewId: review.reviewId,
              businessProfileId,
              businessProfileName: businessProfile.businessProfileName,
              executionTimestamp: businessProfile.executionTimestamp,
              reviewer: review.reviewer,
              starRating: review.starRating,
              comment: review.comment || '',
              createTime: review.createTime,
              updateTime: review.updateTime,
              reviewReply: review.reviewReply,
              replyStatus: review.reviewReply ? 'replied' : 'pending',
              name: review.name,
            };
            reviewsToProcess.push(reviewService.createReview(reviewData));
            newReviewsCount++;
          }
        }

        // Execute all create operations in parallel
        await Promise.all(reviewsToProcess);

        results.push({
          businessProfileId,
          newReviewsCount,
          updatedReviewsCount,
          success: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Processed reviews for ${results.length} business profiles`,
        results,
      });
    }
    // Handle case where client sends a single business profile with reviews
    else if (body.reviews && Array.isArray(body.reviews)) {
      const businessProfileId = body.businessProfileId.toString();

      const existingReviews = await reviewService.getReviewsByBusinessProfileId(businessProfileId);
      const existingReviewIds = new Set(existingReviews.map((r) => r.reviewId));

      const reviewsToProcess = [];
      let newReviewsCount = 0;
      let updatedReviewsCount = 0;

      for (const review of body.reviews) {
        if (existingReviewIds.has(review.reviewId)) {
          // Update existing review
          const reviewData: Partial<ReviewDocument> = {
            starRating: review.starRating,
            comment: review.comment || '',
            updateTime: review.updateTime,
            reviewReply: review.reviewReply,
            replyStatus: review.reviewReply ? 'replied' : 'pending',
          };
          await reviewService.updateReview(review.reviewId, reviewData);
          updatedReviewsCount++;
        } else {
          // Create new review
          const reviewData: ReviewDocument = {
            reviewId: review.reviewId,
            businessProfileId,
            businessProfileName: body.businessProfileName,
            executionTimestamp: body.executionTimestamp,
            reviewer: review.reviewer,
            starRating: review.starRating,
            comment: review.comment || '',
            createTime: review.createTime,
            updateTime: review.updateTime,
            reviewReply: review.reviewReply,
            replyStatus: review.reviewReply ? 'replied' : 'pending',
            name: review.name,
          };
          reviewsToProcess.push(reviewService.createReview(reviewData));
          newReviewsCount++;
        }
      }

      // Execute all create operations in parallel
      await Promise.all(reviewsToProcess);

      return NextResponse.json({
        success: true,
        message: `Processed ${body.reviews.length} reviews`,
        newReviewsCount,
        updatedReviewsCount,
        totalProcessed: newReviewsCount + updatedReviewsCount,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid data format. Expected array of business profiles with reviews or single business profile with reviews array.',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Error processing reviews:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process reviews',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
