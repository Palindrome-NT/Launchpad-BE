import { Router } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import jwt, { SignOptions } from 'jsonwebtoken';
import {
  validateRequest,
  userRegistrationSchema,
  userLoginSchema,
  otpVerificationSchema,
  resendOtpSchema,
  refreshTokenSchema
} from '../middlewares/validation';
import { User } from '../models/User';

export interface AuthDependencies {
  userController: {
    register: (req: any, res: any) => Promise<void>;
    login: (req: any, res: any) => Promise<void>;
    verifyOtp: (req: any, res: any) => Promise<void>;
    resendOtp: (req: any, res: any) => Promise<void>;
    refreshToken: (req: any, res: any) => Promise<void>;
  };
}

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export const createAuthRoutes = (dependencies: AuthDependencies) => {
  const router = Router();

  router.post('/register', validateRequest(userRegistrationSchema), dependencies.userController.register);

  router.post('/login', validateRequest(userLoginSchema), dependencies.userController.login);

  router.post('/verify-otp', validateRequest(otpVerificationSchema), dependencies.userController.verifyOtp);

  router.post('/resend-otp', validateRequest(resendOtpSchema), dependencies.userController.resendOtp);

  router.post('/refresh-token', validateRequest(refreshTokenSchema), dependencies.userController.refreshToken);

  router.post('/logout', (req, res) => {
    res.clearCookie('auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  router.post('/google-login', async (req, res) => {
    try {
      // Extract the Google id_token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const idToken = authHeader.split(' ')[1];

      // Verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload: TokenPayload = ticket.getPayload()!;

      // Verify audience matches your client ID (security check)
      if (payload && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ message: 'Token verification failed' });
      }

      const { email, name, picture, sub: googleId } = payload;

      // Check if user exists in your database
      let user = await User.findOne({ email });

      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          email,
          name,
          picture,
          googleId,
          provider: 'google',
          isVerified: true, // Google users are pre-verified
          isActive: true, // Activate Google users immediately
          lastLogin: new Date(),
          // Don't set aadhaarNumber or mobile for Google users
        });
      } else {
        // Update existing user with Google info
        user.googleId = googleId;
        user.picture = picture;
        user.provider = 'google';
        user.isVerified = true;
        user.isActive = true;
        user.lastLogin = new Date();
        await user.save();
      }

      // Generate YOUR JWT token (same as your existing login)
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET is not defined');

      const accessToken = jwt.sign(
        { userId: user._id, email: user.email },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as SignOptions
      );

      // Generate refresh token
      const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
      const refreshToken = jwt.sign(
        { userId: user._id },
        refreshSecret,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as SignOptions
      );

      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000, // 1 hour
        path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      res.json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            provider: user.provider,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
          },
          accessToken,
          refreshToken,
        },
      });

    } catch (error: any) {
      console.error('Google login error:', error);
      res.status(500).json({
        message: 'Google authentication failed',
        error: error.message
      });
    }
  });

  router.post('/sync-session', async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'No idToken provided'
        });
      }

      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload: TokenPayload = ticket.getPayload()!;

      if (payload && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({
          success: false,
          message: 'Token verification failed'
        });
      }

      const { email } = payload;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET is not defined');

      const accessToken = jwt.sign(
        { userId: user._id, email: user.email },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as SignOptions
      );

      const refreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;
      const refreshToken = jwt.sign(
        { userId: user._id },
        refreshSecret,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as SignOptions
      );

      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        success: true,
        message: 'Session synced successfully',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            provider: user.provider,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
          },
          accessToken,
          refreshToken,
        },
      });

    } catch (error: any) {
      console.error('Sync session error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync session',
        error: error.message
      });
    }
  });

  return router;
};

import { UserController } from '../controllers/userController';
export default createAuthRoutes({ userController: UserController });
