import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { StatsService } from './stats.service';
import { STATS_MESSAGES } from './stats.constant';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const { profileId } = req.query;
  const result = await StatsService.getDashboardStats(profileId as string);

  res.status(StatusCodes.OK).json({
    success: true,
    statusCode: StatusCodes.OK,
    message: STATS_MESSAGES.DASHBOARD_FETCH_SUCCESS,
    data: result,
  });
});

const getProfileStats = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsService.getProfileStats();

  res.status(StatusCodes.OK).json({
    success: true,
    statusCode: StatusCodes.OK,
    message: STATS_MESSAGES.PROFILE_FETCH_SUCCESS,
    data: result,
  });
});

const getFilteredStats = catchAsync(async (req: Request, res: Response) => {
  const { status, rating, profileId, search } = req.query;
  const result = await StatsService.getFilteredStats({
    status: status as string,
    rating: rating as string,
    profileId: profileId as string,
    search: search as string,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    statusCode: StatusCodes.OK,
    message: STATS_MESSAGES.FILTERED_FETCH_SUCCESS,
    data: result,
  });
});

export const StatsController = {
  getDashboardStats,
  getProfileStats,
  getFilteredStats,
};