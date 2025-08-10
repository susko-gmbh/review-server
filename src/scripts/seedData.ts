import mongoose from 'mongoose';
import { Review } from '../app/modules/review/review.model';
import config from '../app/config';

const demoData = {
  businessProfileId: '4190239679011069952',
  businessProfileName: 'Google Review Replies - Goa Hafencity',
  executionTimestamp: '2025-08-05T15:02:19.162+02:00',
  reviews: [
    {
      reviewId: 'AbFvOqmJLz2GWnFJEuyFJBrRlb_dZ2JIcPZXUkXHgeuloCZov9fnaJjfBx-J9agkDGMW8_mowPEmJQ',
      reviewer: {
        profilePhotoUrl: 'https://lh3.googleusercontent.com/a/ACg8ocIRZukSRYTbxqIjVUH-3fxh8JkuYVgz3xbOgRBDTnd_DxIimg=s120-c-rp-mo-ba2-br100',
        displayName: 'Johann Albang'
      },
      starRating: 'FIVE',
      comment: 'Sehr schön\nGute Bedingungen\nUnd vor allem leckeres Essen\n\n(Translated by Google)\nVery nice\nGood conditions\nAnd above all, delicious food',
      createTime: '2025-08-04T18:32:06.555141Z',
      updateTime: '2025-08-04T18:32:06.555141Z',
      name: 'accounts/111536592247373497212/locations/4190239679011069941/reviews/AbFvOqmJLz2GWnFJEuyFJBrRlb_dZ2JIcPZXUkXHgeuloCZov9fnaJjfBx-J9agkDGMW8_mowPEmJQ'
    },
    {
      reviewId: 'AbFvOqlYJQKpe-oJVaVyDkRnHsGV2zYCKsCVT1PCvO7DXuzkGql4Bh4wnDGNYpHRVqgnIdrt0rpG',
      reviewer: {
        profilePhotoUrl: 'https://lh3.googleusercontent.com/a-/ALV-UjX2KOkEjcLuFQZpK-4u6oDLRTbB9e98xfAy96nzkfUDjP9PcUIT=s120-c-rp-mo-ba2-br100',
        displayName: 'Florian Grewe'
      },
      starRating: 'FIVE',
      comment: 'Wer auf der Suche nach indischer Küche in stilvollem Ambiente ist, wird im Goa definitiv fündig. Das Essen ist einfach mega lecker – voller Aromen, frisch zubereitet und liebevoll angerichtet.',
      createTime: '2025-08-03T17:16:47.243932Z',
      updateTime: '2025-08-03T17:16:47.243932Z',
      reviewReply: {
        comment: 'Hallo Florian,\n\nvielen Dank für deine freundliche Rezension! Es freut uns riesig zu hören, dass dir unser indisches Essen so gut geschmeckt hat und dass du die Atmosphäre im Goa genossen hast. 😊',
        updateTime: '2025-08-04T08:00:50.561152Z'
      },
      name: 'accounts/111536592247373497212/locations/4190239679011069941/reviews/AbFvOqlYJQKpe-oJVaVyDkRnHsGV2zYCKsCVT1PCvO7DXuzkGql4Bh4wnDGNYpHRVqgnIdrt0rpG'
    },
    {
      reviewId: 'AbFvOqnjr5YBfudvn8DU8FzQUZxiAYdSC77tmJqiyCidKgN9DPQfGhmWoYriV76Rqen7oZXDLe6xyg',
      reviewer: {
        profilePhotoUrl: 'https://lh3.googleusercontent.com/a-/ALV-UjUbRQZ8kraLG-a5xWnFZxC3X4-oxHDeq3uuQ5MC3sxyj_r6Bh1yUg=s120-c-rp-mo-ba2-br100',
        displayName: 'Lo. Fe.'
      },
      starRating: 'FIVE',
      createTime: '2025-08-03T08:06:39.370029Z',
      updateTime: '2025-08-03T08:06:39.370029Z',
      reviewReply: {
        comment: 'Vielen Dank für deine Bewertung, Lo. Fe.! Wir freuen uns immer über Feedback – egal, ob positiv oder negativ.',
        updateTime: '2025-08-04T08:00:50.562839Z'
      },
      name: 'accounts/111536592247373497212/locations/4190239679011069941/reviews/AbFvOqnjr5YBfudvn8DU8FzQUZxiAYdSC77tmJqiyCidKgN9DPQfGhmWoYriV76Rqen7oZXDLe6xyg'
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