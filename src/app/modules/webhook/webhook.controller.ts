import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { WebhookService } from './webhook.service';

const receiveReviewData = catchAsync(async (req: Request, res: Response) => {
  const result = await WebhookService.processReviewData(req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Review data processed successfully',
    data: result,
  });
});

const getWebhookStatus = catchAsync(async (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Webhook endpoint is active',
    data: {
      status: 'active',
      timestamp: new Date().toISOString(),
      endpoints: {
        reviews: '/api/webhook/reviews',
      },
    },
  });
});

export const WebhookController = {
  receiveReviewData,
  getWebhookStatus,
};
