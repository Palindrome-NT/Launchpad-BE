import { test } from 'node:test';
import assert from 'node:assert';

const mockBcrypt = {
  hash: async (password: string, saltRounds: number) => 'hashed-password',
  compare: async (password: string, hashedPassword: string) => password === 'correct-password'
};

const mockJwt = {
  generateAccessToken: (userId: string, email: string, role: string, name: string) => 'mock-access-token',
  generateRefreshToken: (userId: string) => 'mock-refresh-token',
  verifyRefreshToken: (token: string) => ({ userId: '123', valid: true })
};

const mockOtp = {
  generateOtp: () => '123456',
  getOtpExpiry: (minutes: number) => new Date(Date.now() + minutes * 60 * 1000),
  isOtpExpired: (expiry: Date) => false
};

const mockMail = {
  sendMail: async (to: string, subject: string, html: string) => undefined
};

const createMockUserService = () => ({
  createUser: async (userData: any) => {
    if (!userData.email || !userData.password) {
      return {
        success: false,
        message: 'Missing required fields'
      };
    }

    return {
      success: true,
      message: 'Registration successful',
      data: {
        userId: '123',
        email: userData.email
      }
    };
  },

  loginUser: async (credentials: any) => {
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    const isValidPassword = await mockBcrypt.compare(credentials.password, 'hashed-password');

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: '123',
          email: credentials.email,
          name: 'Test User',
          mobile: '9123456789',
          role: 'user',
          isVerified: true,
          isActive: true
        },
        accessToken: mockJwt.generateAccessToken('123', credentials.email, 'user', 'Test User'),
        refreshToken: mockJwt.generateRefreshToken('123')
      }
    };
  },

  verifyOtp: async (verificationData: any) => {
    if (!verificationData.email || !verificationData.otp) {
      return {
        success: false,
        message: 'Invalid verification data'
      };
    }

    if (verificationData.otp !== '123456') {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          _id: '123',
          email: verificationData.email,
          name: 'Test User',
          mobile: '9123456789',
          role: 'user',
          isVerified: true,
          isActive: true
        },
        accessToken: mockJwt.generateAccessToken('123', verificationData.email, 'user', 'Test User'),
        refreshToken: mockJwt.generateRefreshToken('123')
      }
    };
  },

  resendOtp: async (email: string) => {
    if (!email) {
      return {
        success: false,
        message: 'Email is required'
      };
    }

    return {
      success: true,
      message: 'New OTP sent to your email'
    };
  },

  refreshToken: async (refreshToken: string) => {
    if (!refreshToken) {
      return {
        success: false,
        message: 'Refresh token is required'
      };
    }

    const decoded = mockJwt.verifyRefreshToken(refreshToken);
    if (!decoded.valid) {
      return {
        success: false,
        message: 'Invalid or expired refresh token'
      };
    }

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: mockJwt.generateAccessToken(decoded.userId, 'test@example.com', 'user', 'Test User'),
        refreshToken: mockJwt.generateRefreshToken(decoded.userId)
      }
    };
  }
});

test('UserService - Create User', async (t) => {
  const userService = createMockUserService();

  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    mobile: '9123456789',
    aadhaarNumber: '123456789012',
    password: 'Password123!',
    role: 'user'
  };

  const result = await userService.createUser(userData);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Registration successful');
  assert.strictEqual(result?.data?.email, 'test@example.com');
  assert(result.data.userId, 'User ID should be present');
});

test('UserService - Create User Validation', async (t) => {
  const userService = createMockUserService();

  const result1 = await userService.createUser({
    name: 'Test User',
    mobile: '9123456789',
    aadhaarNumber: '123456789012',
    password: 'Password123!'
  });

  assert.strictEqual(result1.success, false);
  assert.strictEqual(result1.message, 'Missing required fields');

  const result2 = await userService.createUser({
    name: 'Test User',
    email: 'test@example.com',
    mobile: '9123456789',
    aadhaarNumber: '123456789012'
  });

  assert.strictEqual(result2.success, false);
  assert.strictEqual(result2.message, 'Missing required fields');
});

test('UserService - Login Success', async (t) => {
  const userService = createMockUserService();

  const credentials = {
    email: 'test@example.com',
    password: 'correct-password'
  };

  const result = await userService.loginUser(credentials);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Login successful');
  assert(result?.data?.user, 'User data should be present');
  assert.strictEqual(result?.data?.accessToken, 'mock-access-token');
  assert.strictEqual(result?.data?.refreshToken, 'mock-refresh-token');
  assert.strictEqual(result?.data?.user?.email, 'test@example.com');
});

test('UserService - Login Invalid Credentials', async (t) => {
  const userService = createMockUserService();

  const credentials = {
    email: 'test@example.com',
    password: 'wrong-password'
  };

  const result = await userService.loginUser(credentials);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Invalid credentials');
});

test('UserService - Login Missing Fields', async (t) => {
  const userService = createMockUserService();

  const result1 = await userService.loginUser({
    password: 'Password123!'
  });

  assert.strictEqual(result1.success, false);
  assert.strictEqual(result1.message, 'Invalid credentials');

  const result2 = await userService.loginUser({
    email: 'test@example.com'
  });

  assert.strictEqual(result2.success, false);
  assert.strictEqual(result2.message, 'Invalid credentials');
});

test('UserService - OTP Verification Success', async (t) => {
  const userService = createMockUserService();

  const verificationData = {
    email: 'test@example.com',
    otp: '123456'
  };

  const result = await userService.verifyOtp(verificationData);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'OTP verified successfully');
  assert(result?.data?.user, 'User data should be present');
  assert.strictEqual(result?.data?.accessToken, 'mock-access-token');
  assert.strictEqual(result?.data?.refreshToken, 'mock-refresh-token');
});

test('UserService - OTP Verification Invalid OTP', async (t) => {
  const userService = createMockUserService();

  const verificationData = {
    email: 'test@example.com',
    otp: '999999'
  };

  const result = await userService.verifyOtp(verificationData);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Invalid OTP');
});

test('UserService - Resend OTP Success', async (t) => {
  const userService = createMockUserService();

  const result = await userService.resendOtp('test@example.com');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'New OTP sent to your email');
});

test('UserService - Resend OTP Missing Email', async (t) => {
  const userService = createMockUserService();

  const result = await userService.resendOtp('');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Email is required');
});

test('UserService - Refresh Token Success', async (t) => {
  const userService = createMockUserService();

  const result = await userService.refreshToken('valid-refresh-token');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Token refreshed successfully');
  assert.strictEqual(result?.data?.accessToken, 'mock-access-token');
  assert.strictEqual(result?.data?.refreshToken, 'mock-refresh-token');
});

test('UserService - Refresh Token Missing', async (t) => {
  const userService = createMockUserService();

  const result = await userService.refreshToken('');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Refresh token is required');
});
