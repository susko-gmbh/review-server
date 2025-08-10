import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { INFO_MESSAGES } from './info.constant';
import { InfoService } from './info.service';

const getBusinessInfo = catchAsync(async (req, res, _next) => {
  const { businessProfileId } = req.params;
  const { includeRecentReviews, recentReviewsLimit } = req.query;
  
  const result = await InfoService.getBusinessInfo(businessProfileId, {
    includeRecentReviews: includeRecentReviews === 'true',
    recentReviewsLimit: recentReviewsLimit ? parseInt(recentReviewsLimit as string, 10) : 5,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: INFO_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getAllProfilesSummary = catchAsync(async (req, res, _next) => {
  const result = await InfoService.getAllProfilesSummary();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'All profiles summary fetched successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const InfoController = {
  getBusinessInfo,
  getAllProfilesSummary,
};