import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the incoming webhook data from n8n
    console.log('Received n8n webhook data:', JSON.stringify(body, null, 2));

    // Process the review data
    // This is where you would:
    // 1. Validate the incoming data
    // 2. Save to your database
    // 3. Update statistics
    // 4. Trigger any additional workflows

    // Example processing:
    if (body.reviewId && body.businessProfileId) {
      // Save review to database
      const reviewData = {
        reviewId: body.reviewId,
        businessProfileId: body.businessProfileId,
        businessProfileName: body.businessProfileName || 'Unknown Profile',
        reviewer: body.reviewer || {},
        starRating: body.starRating,
        comment: body.comment,
        createTime: body.createTime,
        updateTime: body.updateTime,
        reviewReply: body.reviewReply,
        replyStatus: body.reviewReply ? 'replied' : 'pending',
        sentimentScore: body.sentimentScore,
        responseTimeHours: body.responseTimeHours,
        name: body.name,
      };

      // Here you would save to your database
      console.log('Processed review data:', reviewData);

      return NextResponse.json({
        success: true,
        message: 'Review webhook processed successfully',
        reviewId: body.reviewId,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid review data' }, { status: 400 });
  } catch (error) {
    console.error('Error processing n8n webhook:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'n8n Review Webhook Endpoint',
    status: 'active',
  });
}
