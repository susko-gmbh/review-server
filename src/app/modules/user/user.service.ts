import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../error/AppError';
import { SESSION_DURATION } from './user.constant';
import { TLoginUser, TSignupUser, TUser } from './user.interface';
import { User } from './user.model';
import { createToken, validatePassword } from './user.utils';

const createUserIntoDB = async (payload: TSignupUser) => {
  const { username, password, shops } = payload;

  // Validate password strength
  if (!validatePassword(password)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Password must be at least 8 characters long and contain at least one number and one special character'
    );
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new AppError(StatusCodes.CONFLICT, 'Username already exists');
  }

  // Validate shop names uniqueness
  for (const shopName of shops) {
    const isUnique = await User.isShopNameUnique(shopName);
    if (!isUnique) {
      throw new AppError(
        StatusCodes.CONFLICT,
        `Shop name "${shopName}" is already taken`
      );
    }
  }

  // Create shop objects
  const shopObjects = shops.map((shopName) => ({
    name: shopName.toLowerCase().trim(),
    displayName: shopName.trim(),
  }));

  const userData: TUser = {
    username,
    password,
    shops: shopObjects,
    role: 'user',
    isBlock: false,
  };

  const result = await User.create(userData);
  return result;
};

const loginUser = async (payload: TLoginUser) => {
  const user = await User.isUserExistsByUsername(payload?.username);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
  }

  if (user?.isBlock) {
    throw new AppError(StatusCodes.FORBIDDEN, 'This user is blocked!');
  }

  if (!(await User.isPasswordMatched(payload?.password, user?.password))) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Incorrect password');
  }

  const jwtPayload = {
    userId: user._id,
    username: user.username,
    role: user.role,
  };

  // Determine token expiry based on rememberMe
  const accessTokenExpiry = payload.rememberMe ? '1h' : '15m';
  const refreshTokenExpiry = payload.rememberMe
    ? SESSION_DURATION.REMEMBER_ME
    : SESSION_DURATION.DEFAULT;

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    accessTokenExpiry
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    refreshTokenExpiry
  );

  // Store refresh token in user document
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken },
    lastLogin: new Date(),
  });

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const logoutUser = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
  }

  // Remove refresh token from user document
  await User.updateOne(
    { refreshTokens: refreshToken },
    { $pull: { refreshTokens: refreshToken } }
  );

  return { message: 'Logged out successfully' };
};

const refreshToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Refresh token is required');
  }

  const decoded = jwt.verify(
    refreshToken,
    config.jwt_refresh_secret as string
  ) as JwtPayload;

  const user = await User.findById(decoded.userId);
  if (!user || !user.refreshTokens?.includes(refreshToken)) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const jwtPayload = {
    userId: user._id,
    username: user.username,
    role: user.role,
  };

  const newAccessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '15m'
  );

  return { accessToken: newAccessToken };
};

const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password -refreshTokens');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};

const getShopData = async (userId: string, shopName: string) => {
  const user = await User.findById(userId).select('shops');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const shop = user.shops.find((s) => s.name === shopName.toLowerCase());
  if (!shop) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Shop not found');
  }

  return {
    shopName: shop.name,
    displayName: shop.displayName,
    message: `This is ${shop.displayName} shop`,
  };
};

export const UserService = {
  createUserIntoDB,
  loginUser,
  logoutUser,
  refreshToken,
  getUserProfile,
  getShopData,
};
