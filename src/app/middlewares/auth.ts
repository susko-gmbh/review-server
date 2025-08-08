/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../error/AppError';
import { TUserRole } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';
import { catchAsync } from '../utils/catchAsync';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Check for token in Authorization header or cookies
    let token = req.headers.authorization || req.cookies.accessToken;

    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as JwtPayload;
    } catch (error) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        `Invalid or expired token ${error}`
      );
    }

    const { role, userId } = decoded;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'This user is not found!');
    }

    if (user?.isBlock) {
      throw new AppError(StatusCodes.FORBIDDEN, 'This user is blocked!');
    }

    // Check if JWT was issued before password change
    if (
      user.passwordChangedAt &&
      User.isJWTIssuedBeforePasswordChanged(
        user.passwordChangedAt,
        decoded.iat!
      )
    ) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!');
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!');
    }

    // Attach user to request
    (req as any).user = decoded as JwtPayload;

    // If this is a subdomain request, verify the user has access to this shop
    const hostname = req.hostname;
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction
      ? 'shop-sphere-auth-hub-backend.vercel.app'
      : 'localhost';

    // Extract subdomain considering the environment
    const subdomain = hostname.replace(`.${domain}`, '');

    if (subdomain && subdomain !== 'www') {
      const userShops = user.shops.map((shop) =>
        typeof shop === 'string' ? shop : shop.name
      );

      if (!userShops.includes(subdomain)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          'You do not have access to this shop'
        );
      }
    }

    next();
  });
};

export default auth;
