import mongoose from 'mongoose';
import { Review } from '../app/modules/review/review.model';
import config from '../app/config';

const demoData = {
  businessProfileId: '4190239679011069941',
  businessProfileName: 'Google Review Replies - Goa Hafencity',
  executionTimestamp: '2025-08-07T15:45:00.000Z',
  reviews: [
    {
      reviewId: 'REVIEW_1_FIVE_STAR',
      reviewer: {
        profilePhotoUrl: 'https://lh3.googleusercontent.com/a/testuser1',
        displayName: 'Satisfied Customer'
      },
      starRating: 'FIVE',
      comment: 'Absolutely fantastic experience! The food was delicious and service was impeccable.',
      createTime: '2025-08-06T12:30:00.000Z',
      updateTime: '2025-08-06T12:30:00.000Z',
      reviewReply: {
        comment: 'Thank you for your kind words! We\'re thrilled you enjoyed your experience.',
        updateTime: '2025-08-06T14:45:00.000Z'
      },
      name: 'accounts/123/locations/456/reviews/REVIEW_1_FIVE_STAR'
    },
    {
      reviewId: 'REVIEW_2_THREE_STAR',
      reviewer: {
        profilePhotoUrl: 'https://lh3.googleusercontent.com/a/testuser2',
        displayName: 'Neutral Customer'
      },
      starRating: 'THREE',
      comment: 'Food was good but service was slow. Ambience is nice though.',
      createTime: '2025-08-05T19:15:00.000Z',
      updateTime: '2025-08-05T19:15:00.000Z',
      name: 'accounts/123/locations/456/reviews/REVIEW_2_THREE_STAR'
    },
    {
      reviewId: 'REVIEW_3_ONE_STAR',
      reviewer: {
        profilePhotoUrl: 'https://lh3.googleusercontent.com/a/testuser3',
        displayName: 'Disappointed Customer'
      },
      starRating: 'ONE',
      comment: 'Very poor experience. My order was wrong and the staff was unhelpful.',
      createTime: '2025-08-04T20:00:00.000Z',
      updateTime: '2025-08-04T20:00:00.000Z',
      reviewReply: {
        comment: 'We sincerely apologize for your experience. Please contact us directly so we can make this right.',
        updateTime: '2025-08-05T09:30:00.000Z'
      },
      name: 'accounts/123/locations/456/reviews/REVIEW_3_ONE_STAR'
    }
  ]
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database_url as string);
    console.log('Connected to MongoDB');

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('Cleared existing reviews');

    // Transform and insert demo data
    const reviewsToInsert = demoData.reviews.map(review => ({
      reviewId: review.reviewId,
      businessProfileId: demoData.businessProfileId,
      businessProfileName: demoData.businessProfileName,
      executionTimestamp: demoData.executionTimestamp,
      reviewer: {
        profilePhotoUrl: review.reviewer.profilePhotoUrl,
        displayName: review.reviewer.displayName
      },
      starRating: review.starRating,
      comment: review.comment,
      createTime: review.createTime,
      updateTime: review.updateTime,
      reviewReply: review.reviewReply ? {
        comment: review.reviewReply.comment,
        updateTime: review.reviewReply.updateTime
      } : undefined,
      replyStatus: review.reviewReply ? 'replied' : 'pending',
      name: review.name,
      sentimentScore: review.starRating === 'FIVE' ? 0.9 : 
                     review.starRating === 'THREE' ? 0.5 : 0.1,
      responseTimeHours: review.reviewReply ? 
        Math.round((new Date(review.reviewReply.updateTime).getTime() - new Date(review.createTime).getTime()) / (1000 * 60 * 60)) : 
        undefined
    }));

    await Review.insertMany(reviewsToInsert);
    console.log(`Inserted ${reviewsToInsert.length} demo reviews`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();