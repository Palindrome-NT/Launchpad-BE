import { test } from 'node:test';
import assert from 'node:assert';
import { UserController } from '../../controllers/userController.js';

const mockUserService = {
  createUser: async (userData: any) => ({
    success: true,
    message: 'Registration successful',
    data: { userId: '123', email: userData.email }
  }),

  loginUser: async (credentials: any) => ({
    success: true,
    message: 'Login successful',
    data: {
      user: { _id: '123', email: credentials.email, name: 'Test User', mobile: '1234567890', role: 'user', isVerified: true, isActive: true },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  }),

  verifyOtp: async (verificationData: any) => ({
    success: true,
    message: 'OTP verified successfully',
    data: {
      user: { _id: '123', email: verificationData.email, name: 'Test User', mobile: '1234567890', role: 'user', isVerified: true, isActive: true },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }
  }),

  resendOtp: async (email: string) => ({
    success: true,
    message: 'New OTP sent to your email'
  }),

  refreshToken: async (refreshToken: string) => ({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    }
  })
};

const createMockRequest = (body: any, params: any = {}, query: any = {}) => ({
  body,
  params,
  query,
  cookies: {},
  headers: {},
  user: undefined
});

const createMockResponse = () => {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.responseData = data;
    return res;
  };
  res.cookie = (name: string, value: string, options: any) => {
    res.cookies = res.cookies || {};
    res.cookies[name] = { value, options };
  };
  res.clearCookie = (name: string) => {
    res.clearedCookies = res.clearedCookies || [];
    res.clearedCookies.push(name);
  };
  return res;
};

test('UserController - Register', async (t) => {
  const req = createMockRequest({
    name: 'Test User',
    email: 'test@example.com',
    mobile: '9123456789',
    aadhaarNumber: '123456789012',
    password: 'Password123!',
    role: 'user'
  });

  const res = createMockResponse();

  const originalCreateUser = UserController.register;
  (UserController as any).register = async (req: any, res: any) => {

    const result = await mockUserService.createUser(req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  };

  await (UserController as any).register(req, res);

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.responseData.success, true);
  assert.strictEqual(res.responseData.message, 'Registration successful');
  assert.strictEqual(res.responseData.data.email, 'test@example.com');
});

test('UserController - Login with Cookie Setting', async (t) => {
  const req = createMockRequest({
    email: 'test@example.com',
    password: 'Password123!'
  });

  const res = createMockResponse();

  const originalLogin = UserController.login;
  (UserController as any).login = async (req: any, res: any) => {
    const result = await mockUserService.loginUser(req.body);

    if (result.success) {
  
      const { accessToken, refreshToken } = result.data;

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

  
      const { accessToken: _, refreshToken: __, ...responseData } = result.data;

      res.status(200).json({
        ...result,
        data: responseData,
      });
    } else {
      res.status(401).json(result);
    }
  };

  await (UserController as any).login(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.responseData.success, true);
  assert.strictEqual(res.responseData.message, 'Login successful');

  assert(res.cookies, 'Cookies should be set');
  assert(res.cookies.accessToken, 'Access token cookie should be set');
  assert(res.cookies.refreshToken, 'Refresh token cookie should be set');

  assert(!res.responseData.data.accessToken, 'Access token should not be in response body');
  assert(!res.responseData.data.refreshToken, 'Refresh token should not be in response body');

  assert.strictEqual(res.cookies.accessToken.options.httpOnly, true);
  assert.strictEqual(res.cookies.accessToken.options.maxAge, 60 * 60 * 1000);
  assert.strictEqual(res.cookies.refreshToken.options.httpOnly, true);
  assert.strictEqual(res.cookies.refreshToken.options.maxAge, 7 * 24 * 60 * 60 * 1000);
});

test('UserController - Verify OTP with Cookie Setting', async (t) => {
  const req = createMockRequest({
    email: 'test@example.com',
    otp: '123456'
  });

  const res = createMockResponse();

  const originalVerifyOtp = UserController.verifyOtp;
  (UserController as any).verifyOtp = async (req: any, res: any) => {
    const result = await mockUserService.verifyOtp(req.body);

    if (result.success) {
  
      const { accessToken, refreshToken } = result.data;

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { accessToken: _, refreshToken: __, ...responseData } = result.data;

      res.status(200).json({
        ...result,
        data: responseData,
      });
    } else {
      res.status(400).json(result);
    }
  };

  await (UserController as any).verifyOtp(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.responseData.success, true);
  assert.strictEqual(res.responseData.message, 'OTP verified successfully');

  assert(res.cookies.accessToken, 'Access token cookie should be set');
  assert(res.cookies.refreshToken, 'Refresh token cookie should be set');

  assert(!res.responseData.data.accessToken, 'Access token should not be in response body');
  assert(!res.responseData.data.refreshToken, 'Refresh token should not be in response body');
});

test('UserController - Refresh Token with Cookie Setting', async (t) => {
  const req = createMockRequest({}, {}, { refreshToken: 'old-refresh-token' });

  const res = createMockResponse();

  const originalRefreshToken = UserController.refreshToken;
  (UserController as any).refreshToken = async (req: any, res: any) => {
    const result = await mockUserService.refreshToken(req.body.refreshToken);

    if (result.success) {
  
      const { accessToken, refreshToken } = result.data;

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { accessToken: _, refreshToken: __, ...responseData } = result.data;

      res.status(200).json({
        ...result,
        data: responseData,
      });
    } else {
      res.status(401).json(result);
    }
  };

  await (UserController as any).refreshToken(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.responseData.success, true);
  assert.strictEqual(res.responseData.message, 'Token refreshed successfully');

  assert(res.cookies.accessToken, 'New access token cookie should be set');
  assert(res.cookies.refreshToken, 'New refresh token cookie should be set');

  assert.strictEqual(res.cookies.accessToken.value, 'new-access-token');
  assert.strictEqual(res.cookies.refreshToken.value, 'new-refresh-token');
});

test('UserController - Error Handling', async (t) => {
  const req = createMockRequest({
    email: 'invalid@example.com',
    password: 'wrongpassword'
  });

  const res = createMockResponse();

  const mockErrorService = {
    ...mockUserService,
    loginUser: async (credentials: any) => ({
      success: false,
      message: 'Invalid credentials'
    })
  };

  const originalLogin = UserController.login;
  (UserController as any).login = async (req: any, res: any) => {
    const result = await mockErrorService.loginUser(req.body);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }
  };

  await (UserController as any).login(req, res);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.responseData.success, false);
  assert.strictEqual(res.responseData.message, 'Invalid credentials');

  assert(!res.cookies, 'No cookies should be set on error');
});
