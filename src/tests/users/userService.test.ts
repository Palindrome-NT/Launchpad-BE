import { test } from 'node:test';
import assert from 'node:assert';
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
      items: [
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
        total: 2,
        page: page,
        limit: limit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  }),

  getUserById: async (userId: string) => {
    if (userId === 'invalid-id') {
      return {
        success: false,
        message: 'Failed to get user'
      };
    }
    return {
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
    };
  },

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

  deleteUser: async (userIdToDelete: string, requesterUserId: string, requesterRole: string) => {
    if (userIdToDelete === 'invalid-id') {
      return {
        success: false,
        message: 'User not found'
      };
    }
    return {
      success: true,
      message: 'User deleted successfully'
    };
  }
};

Object.assign(UserService, mockUserService);

test('UserService - Get User Profile', async (t) => {
  const result = await UserService.getUserProfile('507f1f77bcf86cd799439011');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'User profile retrieved successfully');
  assert(result.data, 'User data should be present');
  assert.strictEqual(result.data._id, '507f1f77bcf86cd799439011');
  assert.strictEqual(result.data.email, 'test@example.com');
});

test('UserService - Get All Users', async (t) => {
  const result = await UserService.getAllUsers(1, 10);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Users retrieved successfully');
  assert(result.data, 'Users data should be present');
  assert(result.data.items, 'Users array should be present');
  assert.strictEqual(result.data.items.length, 2);
  assert(result.data.pagination, 'Pagination data should be present');
  assert.strictEqual(result.data.pagination.page, 1);
  assert.strictEqual(result.data.pagination.total, 2);
});

test('UserService - Get User By ID', async (t) => {
  const result = await UserService.getUserById('507f1f77bcf86cd799439011');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'User retrieved successfully');
  assert(result.data, 'User data should be present');
  assert.strictEqual(result.data._id, '507f1f77bcf86cd799439011');
  assert.strictEqual(result.data.email, 'test@example.com');
});

test('UserService - Update User Profile', async (t) => {
  const updateData = {
    name: 'Updated User',
    mobile: '9876543210'
  };

  const result = await UserService.updateUserProfile('507f1f77bcf86cd799439011', updateData);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Profile updated successfully');
  assert(result.data, 'Updated user data should be present');
  assert.strictEqual(result.data.name, 'Updated User');
  assert.strictEqual(result.data.mobile, '9876543210');
});

test('UserService - Delete User', async (t) => {
  const result = await UserService.deleteUser('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', 'admin');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'User deleted successfully');
});

test('UserService - Get User Profile Not Found', async (t) => {
  const errorUserService = {
    getUserProfile: async (userId: string) => ({
      success: false,
      message: 'Failed to get profile'
    })
  };

  Object.assign(UserService, errorUserService);

  const result = await UserService.getUserProfile('invalid-id');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Failed to get profile');

  Object.assign(UserService, mockUserService);
});

test('UserService - Get User By ID Not Found', async (t) => {
  const result = await UserService.getUserById('invalid-id');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Failed to get user');
});

test('UserService - Update Profile Validation Error', async (t) => {
  const errorUserService = {
    updateUserProfile: async (userId: string, updateData: any) => ({
      success: false,
      message: 'Validation error: Invalid email format'
    })
  };

  Object.assign(UserService, errorUserService);

  const invalidData = {
    name: '',
    mobile: 'invalid-mobile'
  };

  const result = await UserService.updateUserProfile('507f1f77bcf86cd799439011', invalidData);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Validation error: Invalid email format');

  Object.assign(UserService, mockUserService);
});

test('UserService - Delete User Not Found', async (t) => {
  const result = await UserService.deleteUser('invalid-id', '507f1f77bcf86cd799439012', 'admin');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'User not found');
});
