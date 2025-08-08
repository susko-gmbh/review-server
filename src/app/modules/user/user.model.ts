import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import config from '../../config';
import { TShop, TUser, UserModel } from './user.interface';

const shopSchema = new Schema<TShop>({
  name: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema<TUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: 0,
    },
    shops: {
      type: [shopSchema],
      required: true,
      validate: {
        validator: function (shops: TShop[]) {
          return shops.length >= 3 && shops.length <= 4;
        },
        message: 'You must provide 3-4 shop names',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    lastLogin: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.index({ 'shops.name': 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds)
    );

    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
  }

  next();
});

userSchema.post('save', async function (doc, next) {
  doc.password = '';
  next();
});

userSchema.statics.isUserExistsByUsername = async function (username: string) {
  return await User.findOne({ username }).select('+password');
};

userSchema.statics.isUserExistsById = async function (id: string) {
  return await User.findOne({ _id: id }).select('+password');
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isShopNameUnique = async function (shopName: string) {
  const normalizedShopName = shopName.toLowerCase().trim();
  const existingShop = await User.findOne({ 'shops.name': normalizedShopName });
  return !existingShop;
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number
) {
  const passwordChangedTime = parseInt(
    (passwordChangedTimestamp.getTime() / 1000).toString(),
    10
  );
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, UserModel>('User', userSchema);
