import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { REVIEW_TRENDS_MESSAGES } from './review-trends.constant';
import { ReviewTrendsService } from './review-trends.service';

const getReviewTrends = catchAsync(async (req, res, _next) => {
  const { period = '30d' } = req.query;
  const { businessProfileId } = req.params;
  
  const result = await ReviewTrendsService.getReviewTrends(
    period as '7d' | '30d' | '3m' | '12m',
    businessProfileId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_TRENDS_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const ReviewTrendsController = {
  getReviewTrends,
};