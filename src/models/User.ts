import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  aadhaarNumber?: string;
  mobile?: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  password?: string;
  isVerified: boolean;
  isActive: boolean;
  isDeleted: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  googleId?: string;
  picture?: string;
  provider?: 'local' | 'google';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: function(): boolean {
        return this.isVerified === true;
      },
      trim: true,
    },
    aadhaarNumber: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      required: function(): boolean {
        return this.provider !== 'google';
      },
    },
    mobile: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      required: function(): boolean {
        return this.provider !== 'google';
      },
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user',
    },
    password: {
      type: String,
      required: function(): boolean {
        return this.provider !== 'google' && this.isNew;
      },
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    picture: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    lastLogin: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    refreshTokenExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index(
  { isActive: 1, isVerified: 1 },
  {
    partialFilterExpression: {
      isActive: true,
      isVerified: true,
      isDeleted: false,
    },
  }
);
userSchema.index({ isDeleted: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
