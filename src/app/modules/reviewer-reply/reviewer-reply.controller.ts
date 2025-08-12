import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { ReviewerReplyService } from './reviewer-reply.service';

const getReviewerRepliesByBusinessProfile = catchAsync(
  async (req: Request, res: Response) => {
    const { businessProfileId } = req.params;
    const { page, limit, startDate, endDate } = req.query;

    const result = await ReviewerReplyService.getReviewerRepliesByBusinessProfile(
      businessProfileId,
      {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
      }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Reviewer replies retrieved successfully',
      statusCode: StatusCodes.OK,
      data: result,
    });
  }
);

const getReviewerReplyById = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  const result = await ReviewerReplyService.getReviewerReplyById(reviewId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Reviewer reply retrieved successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const deleteReviewerReply = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  const result = await ReviewerReplyService.deleteReviewerReply(reviewId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Reviewer reply deleted successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export {
  getReviewerRepliesByBusinessProfile,
  getReviewerReplyById,
  deleteReviewerReply,
};