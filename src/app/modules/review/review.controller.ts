import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { REVIEW_MESSAGES } from './review.constant';
import { ReviewService } from './review.service';
import { WebhookService } from '../webhook/webhook.service';

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const { businessProfileId } = req.params;
  const { status, rating, search, page, limit } = req.query;

  const filters = {
    profileId: businessProfileId,
    status: status as string,
    rating: rating as string,
    search: search as string,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10,
  };

  const result = await ReviewService.getAllReviews(filters);

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewService.getReviewById(id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getReplySummary = catchAsync(async (req: Request, res: Response) => {
  const { businessProfileId, startDate, endDate, aiGenerated, page, limit } = req.query;

  const filters = {
    businessProfileId: businessProfileId as string,
    startDate: startDate as string,
    endDate: endDate as string,
    aiGenerated: aiGenerated !== undefined ? aiGenerated === 'true' : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10,
  };

  const result = await ReviewService.getReplySummary(filters);

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: REVIEW_MESSAGES.CREATE_SUCCESS,
    statusCode: StatusCodes.CREATED,
    data: result,
  });
});

const createBatchReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await WebhookService.processReviewData(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Batch reviews created successfully',
    statusCode: StatusCodes.CREATED,
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewService.updateReview(id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_MESSAGES.UPDATE_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await ReviewService.deleteReview(id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_MESSAGES.DELETE_SUCCESS,
    statusCode: StatusCodes.OK,
    data: null,
  });
});



const getRecentReviews = catchAsync(async (req: Request, res: Response) => {
  const { businessProfileId } = req.params;
  const { limit } = req.query;
  const result = await ReviewService.getRecentReviews(
    limit ? parseInt(limit as string, 10) : 4,
    businessProfileId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: REVIEW_MESSAGES.FETCH_SUCCESS,
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const ReviewController = {
  getAllReviews,
  getReviewById,
  createReview,
  createBatchReviews,
  updateReview,
  deleteReview,
  getRecentReviews,
  getReplySummary,
};