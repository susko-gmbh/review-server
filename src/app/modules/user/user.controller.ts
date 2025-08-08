import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { catchAsync } from '../../utils/catchAsync';
import { UserService } from './user.service';

const createUser = catchAsync(async (req, res, _next) => {
  const result = await UserService.createUserIntoDB(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'User created successfully',
    statusCode: StatusCodes.CREATED,
    data: {
      _id: result._id,
      username: result.username,
      shops: result.shops.map((shop) => ({
        name: shop.name,
        displayName: shop.displayName,
      })),
    },
  });
});

const loginUser = catchAsync(async (req, res, _next) => {
  const result = await UserService.loginUser(req.body);
  const { refreshToken, accessToken, user } = result;

  // Set refresh token as httpOnly cookie with subdomain support
  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    domain: config.NODE_ENV === 'production' ? '.yourdomain.com' : '.localhost',
    sameSite: 'lax',
    maxAge: req.body.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000, // 7 days or 30 minutes
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'User logged in successfully',
    statusCode: StatusCodes.OK,
    data: {
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        shops: user.shops.map((shop) => ({
          name: shop.name,
          displayName: shop.displayName,
        })),
        role: user.role,
      },
    },
  });
});

const logoutUser = catchAsync(async (req, res, _next) => {
  const { refreshToken } = req.cookies;
  const result = await UserService.logoutUser(refreshToken);

  res.clearCookie('refreshToken', {
    domain: config.NODE_ENV === 'production' ? '.yourdomain.com' : '.localhost',
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'User logged out successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res, _next) => {
  const { refreshToken } = req.cookies;
  const result = await UserService.refreshToken(refreshToken);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Token refreshed successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getProfile = catchAsync(async (req, res, _next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (req as any).user.userId;
  const result = await UserService.getUserProfile(userId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Profile retrieved successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

const getShopData = catchAsync(async (req, res, _next) => {
  const { shopName } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (req as any).user.userId;
  const result = await UserService.getShopData(userId, shopName);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Shop data retrieved successfully',
    statusCode: StatusCodes.OK,
    data: result,
  });
});

export const UserController = {
  createUser,
  loginUser,
  logoutUser,
  refreshToken,
  getProfile,
  getShopData,
};
