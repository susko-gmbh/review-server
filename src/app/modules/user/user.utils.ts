// user.utils.ts - Alternative approach
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const createToken = (
  jwtPayload: { userId?: Types.ObjectId; username: string; role: string },
  secret: string,
  expiresIn: string | number
) => {
  // Convert common time strings to seconds if needed
  let expiry: string | number = expiresIn;

  if (typeof expiresIn === 'string') {
    // Ensure the string format is valid for JWT
    const validFormats = ['15m', '30m', '1h', '7d', '24h'];
    if (!validFormats.some((format) => expiresIn.includes(format.slice(-1)))) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }
    expiry = expiresIn;
  }

  return jwt.sign(jwtPayload, secret, {
    expiresIn: expiry as jwt.SignOptions['expiresIn'],
  });
};
export const validatePassword = (password: string): boolean => {
  // At least 8 characters, one number, one special character
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};
