import { test } from 'node:test';
import assert from 'node:assert';
import { UserController } from '../../controllers/userController.js';
import { UserService } from '../../services/userService.js';

const mockUserService = {
  getUserProfile: async (userId: string) => ({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      _id: userId,
      name: 'Test User',
      email: 'test@example.com',
      mobile: '9123456789',
      role: 'user',
      isVerified: true,
      isActive: true
    }
  }),

  getAllUsers: async (page: number, limit: number) => ({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'User 1',
          email: 'user1@example.com',
          role: 'user'
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'User 2',
          email: 'user2@example.com',
          role: 'user'
        }
      ],
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalUsers: 2,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  }),

  getUserById: async (userId: string) => ({
    success: true,
    message: 'User retrieved successfully',
    data: {
      _id: userId,
      name: 'Test User',
      email: 'test@example.com',
      mobile: '9123456789',
      role: 'user',
      isVerified: true,
      isActive: true
    }
  }),

  updateUserProfile: async (userId: string, updateData: any) => ({
    success: true,
    message: 'Profile updated successfully',
    data: {
      _id: userId,
      name: updateData.name || 'Test User',
      email: 'test@example.com',
      mobile: updateData.mobile || '9123456789',
      role: 'user',
      isVerified: true,
      isActive: true
    }
  }),

  deleteUser: async (userIdToDelete: string, requesterUserId: string, requesterRole: string) => ({
    success: true,
    message: 'User deleted successfully'
  })
};

const originalUserService = UserService;
Object.assign(UserService, mockUserService);

test('UserController - Get Profile', async (t) => {
  const mockRequest = {
    user: { userId: '507f1f77bcf86cd799439011' }
  } as any;

  const mockResponse = {
    status: (code: number) => {
      mockResponse.statusCode = code;
      return mockResponse;
    },
    json: (data: any) => {
      mockResponse.responseData = data;
      return mockResponse;
    },
    statusCode: 0,
    responseData: null
  } as any;

  await UserController.getProfile(mockRequest, mockResponse);

  assert.strictEqual(mockResponse.statusCode, 200);
  assert.strictEqual(mockResponse.responseData.success, true);
  assert.strictEqual(mockResponse.responseData.message, 'User profile retrieved successfully');
  assert(mockResponse.responseData.data, 'User data should be present');
  assert.strictEqual(mockResponse.responseData.data._id, '507f1f77bcf86cd799439011');
});

test('UserController - Get All Users', async (t) => {
  const mockRequest = {
    query: { page: '1', limit: '10' }
  } as any;

  const mockResponse = {
    status: (code: number) => {
      mockResponse.statusCode = code;
      return mockResponse;
    },
    json: (data: any) => {
      mockResponse.responseData = data;
      return mockResponse;
    },
    statusCode: 0,
    responseData: null
  } as any;

  await UserController.getAllUsers(mockRequest, mockResponse);

  assert.strictEqual(mockResponse.statusCode, 200);
  assert.strictEqual(mockResponse.responseData.success, true);
  assert.strictEqual(mockResponse.responseData.message, 'Users retrieved successfully');
  assert(mockResponse.responseData.data.users, 'Users array should be present');
  assert.strictEqual(mockResponse.responseData.data.users.length, 2);
  assert(mockResponse.responseData.data.pagination, 'Pagination data should be present');
});

test('UserController - Get User By ID', async (t) => {
  const mockRequest = {
    params: { id: '507f1f77bcf86cd799439011' }
  } as any;

  const mockResponse = {
    status: (code: number) => {
      mockResponse.statusCode = code;
      return mockResponse;
    },
    json: (data: any) => {
      mockResponse.responseData = data;
      return mockResponse;
    },
    statusCode: 0,
    responseData: null
  } as any;

  await UserController.getUserById(mockRequest, mockResponse);

  assert.strictEqual(mockResponse.statusCode, 200);
  assert.strictEqual(mockResponse.responseData.success, true);
  assert.strictEqual(mockResponse.responseData.message, 'User retrieved successfully');
  assert(mockResponse.responseData.data, 'User data should be present');
  assert.strictEqual(mockResponse.responseData.data._id, '507f1f77bcf86cd799439011');
});

test('UserController - Update Profile', async (t) => {
  const mockRequest = {
    user: { userId: '507f1f77bcf86cd799439011' },
    body: {
      name: 'Updated User',
      mobile: '9876543210'
    }
  } as any;

  const mockResponse = {
    status: (code: number) => {
      mockResponse.statusCode = code;
      return mockResponse;
    },
    json: (data: any) => {
      mockResponse.responseData = data;
      return mockResponse;
    },
    statusCode: 0,
    responseData: null
  } as any;

  await UserController.updateProfile(mockRequest, mockResponse);

  assert.strictEqual(mockResponse.statusCode, 200);
  assert.strictEqual(mockResponse.responseData.success, true);
  assert.strictEqual(mockResponse.responseData.message, 'Profile updated successfully');
  assert(mockResponse.responseData.data, 'Updated user data should be present');
  assert.strictEqual(mockResponse.responseData.data.name, 'Updated User');
  assert.strictEqual(mockResponse.responseData.data.mobile, '9876543210');
});

test('UserController - Delete User', async (t) => {
  const mockRequest = {
    user: { userId: '507f1f77bcf86cd799439011', role: 'admin' },
    params: { id: '507f1f77bcf86cd799439012' }
  } as any;

  const mockResponse = {
    status: (code: number) => {
      mockResponse.statusCode = code;
      return mockResponse;
    },
    json: (data: any) => {
      mockResponse.responseData = data;
      return mockResponse;
    },
    statusCode: 0,
    responseData: null
  } as any;

  await UserController.deleteUser(mockRequest, mockResponse);

  assert.strictEqual(mockResponse.statusCode, 200);
  assert.strictEqual(mockResponse.responseData.success, true);
  assert.strictEqual(mockResponse.responseData.message, 'User deleted successfully');
});

test('UserController - Error Handling', async (t) => {
  const errorUserService = {
    getUserProfile: async (userId: string) => ({
      success: false,
      message: 'User not found'
    })
  };

  Object.assign(UserService, errorUserService);

  const mockRequest = {
    user: { userId: 'invalid-id' }
  } as any;

  const mockResponse = {
    status: (code: number) => {
      mockResponse.statusCode = code;
      return mockResponse;
    },
    json: (data: any) => {
      mockResponse.responseData = data;
      return mockResponse;
    },
    statusCode: 0,
    responseData: null
  } as any;

  await UserController.getProfile(mockRequest, mockResponse);

  assert.strictEqual(mockResponse.statusCode, 404);
  assert.strictEqual(mockResponse.responseData.success, false);
  assert.strictEqual(mockResponse.responseData.message, 'User not found');

  Object.assign(UserService, mockUserService);
});
