import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { createAuthRoutes, AuthDependencies } from '../../routes/auth.js';

const mockUserController = {
  register: async (req: any, res: any) => {
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { userId: '123', email: req.body.email }
    });
  },

  login: async (req: any, res: any) => {
    res.cookie('accessToken', 'mock-access-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', 'mock-refresh-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: '123',
          email: req.body.email,
          name: 'Test User',
          mobile: '9123456789',
          role: 'user',
          isVerified: true,
          isActive: true
        }
      }
    });
  },

  verifyOtp: async (req: any, res: any) => {
    res.cookie('accessToken', 'verified-access-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', 'verified-refresh-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          _id: '123',
          email: req.body.email,
          name: 'Test User',
          mobile: '9123456789',
          role: 'user',
          isVerified: true,
          isActive: true
        }
      }
    });
  },

  resendOtp: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email'
    });
  },

  refreshToken: async (req: any, res: any) => {
    res.cookie('accessToken', 'refreshed-access-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', 'refreshed-refresh-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {}
    });
  }
};

const mockValidation = {
  validateRequest: (schema: any) => (req: any, res: any, next: any) => next(),
  userRegistrationSchema: {},
  userLoginSchema: {},
  otpVerificationSchema: {},
  resendOtpSchema: {},
  refreshTokenSchema: {}
};

test('Auth Routes - Registration', async (t) => {
  const app = express();
  app.use(express.json());

  const authRoutes = createAuthRoutes({
    userController: mockUserController
  } as AuthDependencies);

  app.use('/api/v1/auth', authRoutes);

  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      mobile: '9123456789',
      aadhaarNumber: '123456789012',
      password: 'Password123!',
      role: 'user'
    })
    .expect(201);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Registration successful');
  assert.strictEqual(response.body.data.email, 'test@example.com');
});

test('Auth Routes - Login with Cookies', async (t) => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  const authRoutes = createAuthRoutes({
    userController: mockUserController
  } as AuthDependencies);

  app.use('/api/v1/auth', authRoutes);

  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'test@example.com',
      password: 'Password123!'
    })
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Login successful');
  assert(response.body.data.user, 'User data should be present');
  assert(!response.body.data.accessToken, 'Access token should not be in response body');
  assert(!response.body.data.refreshToken, 'Refresh token should not be in response body');
});

test('Auth Routes - OTP Verification with Cookies', async (t) => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  const authRoutes = createAuthRoutes({
    userController: mockUserController
  } as AuthDependencies);

  app.use('/api/v1/auth', authRoutes);

  const response = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send({
      email: 'test@example.com',
      otp: '123456'
    })
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'OTP verified successfully');
  assert(response.body.data.user, 'User data should be present');
  assert(!response.body.data.accessToken, 'Access token should not be in response body');
  assert(!response.body.data.refreshToken, 'Refresh token should not be in response body');
});

test('Auth Routes - Token Refresh with Cookies', async (t) => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  const authRoutes = createAuthRoutes({
    userController: mockUserController
  } as AuthDependencies);

  app.use('/api/v1/auth', authRoutes);

  const response = await request(app)
    .post('/api/v1/auth/refresh-token')
    .send({
      refreshToken: 'old-refresh-token'
    })
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Token refreshed successfully');
  assert(!response.body.data.accessToken, 'Access token should not be in response body');
  assert(!response.body.data.refreshToken, 'Refresh token should not be in response body');
});

test('Auth Routes - Resend OTP', async (t) => {
  const app = express();
  app.use(express.json());

  const authRoutes = createAuthRoutes({
    userController: mockUserController
  } as AuthDependencies);

  app.use('/api/v1/auth', authRoutes);

  const response = await request(app)
    .post('/api/v1/auth/resend-otp')
    .send({
      email: 'test@example.com'
    })
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'New OTP sent to your email');
});

test('Auth Routes - Logout', async (t) => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  const authRoutes = createAuthRoutes({
    userController: mockUserController
  } as AuthDependencies);

  app.use('/api/v1/auth', authRoutes);

  const response = await request(app)
    .post('/api/v1/auth/logout')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Logged out successfully');
});
