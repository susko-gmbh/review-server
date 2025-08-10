import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { RESPONSE_TRENDS_MESSAGES } from './response-trends.constant';
import { ResponseTrendsService } from './response-trends.service';

const getResponseTrends = catchAsync(async (req, res, _next) => {
  const { period = '30d' } = req.query;
  const { businessProfileId } = req.params;
  
  const result = await ResponseTrendsService.getResponseTrends(
    period as '7d' | '30d' | '3m',
    businessProfileId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: RESPONSE_TRENDS_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const ResponseTrendsController = {
  getResponseTrends,
};