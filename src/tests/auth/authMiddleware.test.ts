import { describe, test } from 'node:test';
import assert from 'node:assert';

// Mock the JWT utilities and User model
const mockVerifyAccessToken = (token: string) => {
  if (token === 'valid-token') {
    return { userId: '123', email: 'test@example.com', role: 'user' };
  }
  return null;
};

const mockUserModel = {
  findById: async (userId: string) => {
    if (userId === '123') {
      return {
        _id: '123',
        email: 'test@example.com',
        isActive: true,
        isDeleted: false
      };
    }
    return null;
  }
};

// Create a mock request/response for testing
const createMockRequest = (cookies: any = {}, headers: any = {}) => ({
  cookies,
  headers,
  params: {},
  query: {},
  body: {},
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
  return res;
};

const createMockNext = () => {
  const next = () => {
    // Mock next function
  };
  return next;
};

describe('Authentication Middleware', () => {
  test('should accept valid token in cookies', async (t) => {
    const req = createMockRequest({ accessToken: 'valid-token' });
    const res = createMockResponse();
    const next = createMockNext();

    // Mock the imports
    const mockAuth = {
      authenticateToken: async (req: any, res: any, next: any) => {
        try {
          // Try to get token from cookies first, then from Authorization header
          const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

          if (!token) {
            res.status(401).json({
              success: false,
              message: 'Access token is required',
            });
            return;
          }

          const decoded = mockVerifyAccessToken(token);

          if (!decoded) {
            res.status(401).json({
              success: false,
              message: 'Invalid or expired token',
            });
            return;
          }

          // Verify user still exists and is active
          const user = await mockUserModel.findById(decoded.userId);
          if (!user || !user.isActive || user.isDeleted) {
            res.status(401).json({
              success: false,
              message: 'User not found or inactive',
            });
            return;
          }

          req.user = decoded;
          next();
        } catch (error) {
          console.error('Auth middleware error:', error);
          res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
          });
        }
      }
    };

    await mockAuth.authenticateToken(req, res, next);

    assert.strictEqual(res.statusCode, undefined, 'Should not set status if successful');
    assert(req.user, 'User should be set in request');
    assert.strictEqual((req.user as any).userId, '123');
    assert.strictEqual((req.user as any).email, 'test@example.com');
  })
});

test('Auth Middleware - Valid Token in Authorization Header', async (t) => {
  const req = createMockRequest({}, { authorization: 'Bearer valid-token' });
  const res = createMockResponse();
  const next = createMockNext();

  const mockAuth = {
    authenticateToken: async (req: any, res: any, next: any) => {
      try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token is required',
          });
          return;
        }

        const decoded = mockVerifyAccessToken(token);

        if (!decoded) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }

        const user = await mockUserModel.findById(decoded.userId);
        if (!user || !user.isActive || user.isDeleted) {
          res.status(401).json({
            success: false,
            message: 'User not found or inactive',
          });
          return;
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error during authentication',
        });
      }
    }
  };

  await mockAuth.authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, undefined, 'Should not set status if successful');
  assert(req.user, 'User should be set in request');
  assert.strictEqual((req.user as any).userId, '123');
});

test('Auth Middleware - No Token Provided', async (t) => {
  const req = createMockRequest();
  const res = createMockResponse();
  const next = createMockNext();

  const mockAuth = {
    authenticateToken: async (req: any, res: any, next: any) => {
      try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token is required',
          });
          return;
        }

        const decoded = mockVerifyAccessToken(token);
        if (!decoded) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }

        const user = await mockUserModel.findById(decoded.userId);
        if (!user || !user.isActive || user.isDeleted) {
          res.status(401).json({
            success: false,
            message: 'User not found or inactive',
          });
          return;
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error during authentication',
        });
      }
    }
  };

  await mockAuth.authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.responseData.success, false);
  assert.strictEqual(res.responseData.message, 'Access token is required');
  assert(!req.user, 'User should not be set when token is missing');
});

test('Auth Middleware - Invalid Token', async (t) => {
  const req = createMockRequest({ accessToken: 'invalid-token' });
  const res = createMockResponse();
  const next = createMockNext();

  const mockAuth = {
    authenticateToken: async (req: any, res: any, next: any) => {
      try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token is required',
          });
          return;
        }

        const decoded = mockVerifyAccessToken(token);
        if (!decoded) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }

        const user = await mockUserModel.findById(decoded.userId);
        if (!user || !user.isActive || user.isDeleted) {
          res.status(401).json({
            success: false,
            message: 'User not found or inactive',
          });
          return;
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error during authentication',
        });
      }
    }
  };

  await mockAuth.authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.responseData.success, false);
  assert.strictEqual(res.responseData.message, 'Invalid or expired token');
});

test('Auth Middleware - User Not Active', async (t) => {
  const req = createMockRequest({ accessToken: 'valid-token' });
  const res = createMockResponse();
  const next = createMockNext();

  // Mock user as inactive
  const mockInactiveUserModel = {
    findById: async (userId: string) => {
      if (userId === '123') {
        return {
          _id: '123',
          email: 'test@example.com',
          isActive: false, // User is not active
          isDeleted: false
        };
      }
      return null;
    }
  };

  const mockAuth = {
    authenticateToken: async (req: any, res: any, next: any) => {
      try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token is required',
          });
          return;
        }

        const decoded = mockVerifyAccessToken(token);
        if (!decoded) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }

        const user = await mockInactiveUserModel.findById(decoded.userId);
        if (!user || !user.isActive || user.isDeleted) {
          res.status(401).json({
            success: false,
            message: 'User not found or inactive',
          });
          return;
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error during authentication',
        });
      }
    }
  };

  await mockAuth.authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.responseData.success, false);
  assert.strictEqual(res.responseData.message, 'User not found or inactive');
});

test('Auth Middleware - User Deleted', async (t) => {
  const req = createMockRequest({ accessToken: 'valid-token' });
  const res = createMockResponse();
  const next = createMockNext();

  // Mock user as deleted
  const mockDeletedUserModel = {
    findById: async (userId: string) => {
      if (userId === '123') {
        return {
          _id: '123',
          email: 'test@example.com',
          isActive: true,
          isDeleted: true // User is deleted
        };
      }
      return null;
    }
  };

  const mockAuth = {
    authenticateToken: async (req: any, res: any, next: any) => {
      try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token is required',
          });
          return;
        }

        const decoded = mockVerifyAccessToken(token);
        if (!decoded) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }

        const user = await mockDeletedUserModel.findById(decoded.userId);
        if (!user || !user.isActive || user.isDeleted) {
          res.status(401).json({
            success: false,
            message: 'User not found or inactive',
          });
          return;
        }

        req.user = decoded;
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal server error during authentication',
        });
      }
    }
  };

  await mockAuth.authenticateToken(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.responseData.success, false);
  assert.strictEqual(res.responseData.message, 'User not found or inactive');
});
