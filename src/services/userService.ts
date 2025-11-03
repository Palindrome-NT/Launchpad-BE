import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOtp, getOtpExpiry, isOtpExpired } from '../utils/otp';
import { sendMail } from '../utils/mail';
import {
  UserRegistrationData,
  UserLoginData,
  UserUpdateData,
  OTPVerificationData,
  ServiceResponse,
  PaginationResult,
  TokenData
} from './types';

export class UserService {
  static async checkExistingUser(email: string, mobile: string, aadhaarNumber: string): Promise<{ exists: boolean; field?: string }> {
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobile },
        { aadhaarNumber }
      ],
      isDeleted: false
    });

    if (!existingUser) {
      return { exists: false };
    }

    if (existingUser.email === email.toLowerCase()) {
      return { exists: true, field: 'email' };
    }
    if (existingUser.mobile === mobile) {
      return { exists: true, field: 'mobile' };
    }
    if (existingUser.aadhaarNumber === aadhaarNumber) {
      return { exists: true, field: 'aadhaarNumber' };
    }

    return { exists: false };
  }

  static async createUser(userData: UserRegistrationData): Promise<ServiceResponse<{ userId: string; email: string }>> {
    try {
      const { email, mobile, aadhaarNumber, password, role = 'user' } = userData;

      const existingUserCheck = await this.checkExistingUser(email, mobile, aadhaarNumber);
      console.log("🚀 ~ UserService ~ createUser ~ existingUserCheck:", existingUserCheck)
      if (existingUserCheck.exists) {
        const fieldMessages = {
          email: 'User with this email already exists',
          mobile: 'User with this mobile number already exists',
          aadhaarNumber: 'User with this Aadhaar number already exists'
        };
        return {
          success: false,
          message: fieldMessages[existingUserCheck.field as keyof typeof fieldMessages] || 'User already exists'
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const otp = generateOtp();
      const otpExpiresAt = getOtpExpiry(5);

      const user = new User({
        name: userData.name,
        email: email.toLowerCase(),
        mobile,
        aadhaarNumber,
        password: hashedPassword,
        role,
        isActive: false,
        isVerified: false,
        otp,
        otpExpiresAt,
      });

      await user.save();

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Verify Your Launchpad Account</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 3px;">${otp}</h1>
          </div>
          <p style="color: #666; text-align: center; margin: 20px 0;">
            This OTP will expire in 5 minutes. Please use it to verify your account.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      `;

      await sendMail(user.email, 'Verify Your Launchpad Account - OTP', html);

      return {
        success: true,
        message: 'Registration successful. Please verify your email with the OTP sent.',
        data: {
          userId: user._id.toString(),
          email: user.email,
        },
      };
    } catch (error: any) {
      console.error('Create user error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message,
      };
    }
  }

  static async loginUser(credentials: UserLoginData): Promise<ServiceResponse<TokenData>> {
    try {
      const { email, password } = credentials;

      const user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is not activated. Please verify your email first.',
        };
      }

      const accessToken = generateAccessToken(
        user._id.toString(),
        user.email,
        user.role,
        user.name || ''
      );

      const refreshToken = generateRefreshToken(user._id.toString());

      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      const userData = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      };

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error.message,
      };
    }
  }

  static async verifyOtp(verificationData: OTPVerificationData): Promise<ServiceResponse<TokenData>> {
    try {
      const { email, otp } = verificationData;

      const user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.isVerified) {
        return {
          success: false,
          message: 'User is already verified',
        };
      }

      if (!user.otp || user.otp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP',
        };
      }

      if (!user.otpExpiresAt || isOtpExpired(user.otpExpiresAt)) {
        return {
          success: false,
          message: 'OTP has expired',
        };
      }

      user.isVerified = true;
      user.isActive = true;
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      const accessToken = generateAccessToken(
        user._id.toString(),
        user.email,
        user.role,
        user.name || ''
      );

      const refreshToken = generateRefreshToken(user._id.toString());

      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      const userData = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
      };

      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: userData,
          accessToken,
          refreshToken,
        },
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'OTP verification failed',
        error: error.message,
      };
    }
  }

  static async resendOtp(email: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        isDeleted: false
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.isVerified) {
        return {
          success: false,
          message: 'User is already verified',
        };
      }

      const otp = generateOtp();
      const otpExpiresAt = getOtpExpiry(5);

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Verify Your Launchpad Account</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 3px;">${otp}</h1>
          </div>
          <p style="color: #666; text-align: center; margin: 20px 0;">
            This OTP will expire in 5 minutes. Please use it to verify your account.
          </p>
          <p style="color: #999; font-size: 12px; text-align: center;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      `;

      await sendMail(user.email, 'Verify Your Launchpad Account - New OTP', html);

      return {
        success: true,
        message: 'New OTP sent to your email',
      };
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        message: 'Failed to resend OTP',
        error: error.message,
      };
    }
  }

  static async refreshToken(refreshToken: string): Promise<ServiceResponse<{ accessToken: string; refreshToken: string }>> {
    try {
      if (!refreshToken) {
        return {
          success: false,
          message: 'Refresh token is required',
        };
      }

      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return {
          success: false,
          message: 'Invalid or expired refresh token',
        };
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.isDeleted) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.refreshToken !== refreshToken || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
        return {
          success: false,
          message: 'Invalid or expired refresh token',
        };
      }

      const newAccessToken = generateAccessToken(
        user._id.toString(),
        user.email,
        user.role,
        user.name || ''
      );

      const newRefreshToken = generateRefreshToken(user._id.toString());

      user.refreshToken = newRefreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error: any) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Failed to refresh token',
        error: error.message,
      };
    }
  }

  static async getUserProfile(userId: string): Promise<ServiceResponse<any>> {
    try {
      const user = await User.findById(userId).select('-password -refreshToken');

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'Profile fetched successfully',
        data: user,
      };
    } catch (error: any) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Failed to get profile',
        error: error.message,
      };
    }
  }

  static async getAllUsers(page: number = 1, limit: number = 10): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      const skip = (page - 1) * limit;

      const users = await User.find({ isDeleted: false })
        .select('-password -refreshToken -otp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments({ isDeleted: false });

      return {
        success: true,
        message: 'Users fetched successfully',
        data: {
          items: users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Get all users error:', error);
      return {
        success: false,
        message: 'Failed to get users',
        error: error.message,
      };
    }
  }

  static async getUserById(userId: string): Promise<ServiceResponse<any>> {
    try {
      const user = await User.findById(userId).select('-password -refreshToken');

      if (!user || user.isDeleted) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'User fetched successfully',
        data: user,
      };
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        message: 'Failed to get user',
        error: error.message,
      };
    }
  }

  static async updateUserProfile(userId: string, updateData: UserUpdateData): Promise<ServiceResponse<any>> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (updateData.mobile && updateData.mobile !== user.mobile) {
        const existingUser = await User.findOne({
          mobile: updateData.mobile,
          isDeleted: false,
          _id: { $ne: user._id }
        });

        if (existingUser) {
          return {
            success: false,
            message: 'Mobile number is already taken',
          };
        }
      }

      if (updateData.name) user.name = updateData.name;
      if (updateData.mobile) user.mobile = updateData.mobile;

      await user.save();

      const updatedUser = await User.findById(user._id).select('-password -refreshToken');

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        error: error.message,
      };
    }
  }

  static async deleteUser(userIdToDelete: string, requesterUserId: string, requesterRole: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      const userToDelete = await User.findById(userIdToDelete);
      if (!userToDelete || userToDelete.isDeleted) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const requester = await User.findById(requesterUserId);
      if (!requester || requester.isDeleted) {
        return {
          success: false,
          message: 'Requester not found',
        };
      }

      if (userIdToDelete === requesterUserId) {
        return {
          success: false,
          message: 'You cannot delete your own account',
        };
      }

      if (requesterRole === 'admin') {
        if (userToDelete.role === 'admin') {
          return {
            success: false,
            message: 'Admins cannot delete other admins',
          };
        }
        if (userToDelete.role === 'superadmin') {
          return {
            success: false,
            message: 'Admins cannot delete superadmins',
          };
        }
        if (userToDelete.role !== 'user') {
          return {
            success: false,
            message: 'Insufficient permissions to delete this user',
          };
        }
      }

      if (requesterRole === 'superadmin') {
        if (userToDelete.role === 'superadmin') {
          return {
            success: false,
            message: 'Superadmins cannot delete other superadmins',
          };
        }
      }

      userToDelete.isDeleted = true;
      userToDelete.isActive = false;
      await userToDelete.save();

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: 'Failed to delete user',
        error: error.message,
      };
    }
  }
}
