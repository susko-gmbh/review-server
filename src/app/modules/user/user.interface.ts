/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';
import { USER_ROLE } from './user.constant';

export type TShop = {
  name: string;
  displayName: string;
  createdAt?: Date;
};

export type TUser = {
  _id?: Types.ObjectId;
  username: string;
  password: string;
  shops: TShop[];
  role: 'admin' | 'user';
  isBlock: boolean;
  refreshTokens?: string[];
  lastLogin?: Date;
  passwordChangedAt?: Date;
};

export type TLoginUser = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

export type TSignupUser = {
  username: string;
  password: string;
  shops: string[];
};

export interface UserModel extends Model<TUser> {
  isUserExistsByUsername(username: string): Promise<TUser>;
  isUserExistsById(id: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  isShopNameUnique(shopName: string): Promise<boolean>;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number
  ): boolean;
}

export type TUserRole = keyof typeof USER_ROLE;
