import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { createUserRoutes, UserDependencies } from '../../routes/users.js';

const mockUserController = {
  getProfile: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        mobile: '9123456789',
        role: 'user',
        isVerified: true,
        isActive: true
      }
    });
  },

  getAllUsers: async (req: any, res: any) => {
    res.status(200).json({
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
          currentPage: 1,
          totalPages: 1,
          totalUsers: 2,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  },

  getUserById: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        _id: req.params.id,
        name: 'Test User',
        email: 'test@example.com',
        mobile: '9123456789',
        role: 'user',
        isVerified: true,
        isActive: true
      }
    });
  },

  updateProfile: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: '507f1f77bcf86cd799439011',
        name: req.body.name || 'Test User',
        email: 'test@example.com',
        mobile: req.body.mobile || '9123456789',
        role: 'user',
        isVerified: true,
        isActive: true
      }
    });
  },

  deleteUser: async (req: any, res: any) => {
    const userIdToDelete = req.params.id;
    const requesterUserId = req.user?.userId;
    const requesterRole = req.user?.role;

    if (userIdToDelete === requesterUserId) {
      res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
      return;
    }

    const mockUserRoles: Record<string, string> = {
      '507f1f77bcf86cd799439011': 'admin',
      '507f1f77bcf86cd799439012': 'user',
      '507f1f77bcf86cd799439013': 'admin',
      '507f1f77bcf86cd799439014': 'superadmin'
    };

    const userToDeleteRole = mockUserRoles[userIdToDelete] || 'user';

    if (requesterRole === 'admin') {
      if (userToDeleteRole === 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admins cannot delete other admins'
        });
        return;
      }
      if (userToDeleteRole === 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Admins cannot delete superadmins'
        });
        return;
      }
    }

    if (requesterRole === 'superadmin') {
      if (userToDeleteRole === 'superadmin') {
        res.status(403).json({
          success: false,
          message: 'Superadmins cannot delete other superadmins'
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  }
};

const mockAuthenticateToken = async (req: any, res: any, next: any) => {
  req.user = { userId: '507f1f77bcf86cd799439011', role: 'user' };
  next();
};

const mockRequireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
  };
};

test('User Routes - Get Profile', async (t) => {
  const app = express();
  app.use(express.json());

  const userRoutes = createUserRoutes({
    userController: mockUserController
  } as UserDependencies);

  userRoutes.stack[0].handle = mockAuthenticateToken;

  app.use('/api/v1/users', userRoutes);

  const response = await request(app)
    .get('/api/v1/users/profile')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'User profile retrieved successfully');
  assert(response.body.data, 'User data should be present');
  assert.strictEqual(response.body.data._id, '507f1f77bcf86cd799439011');
});

test('User Routes - Get All Users (Admin)', async (t) => {
  const app = express();
  app.use(express.json());

  const userRoutes = createUserRoutes({
    userController: mockUserController
  } as UserDependencies);


  const mockAuthAdmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
    next();
  };

  userRoutes.stack[0].handle = mockAuthAdmin;
  userRoutes.stack[1].handle = mockRequireRole(['admin', 'superadmin']);

  app.use('/api/v1/users', userRoutes);

  const response = await request(app)
    .get('/api/v1/users')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Users retrieved successfully');
  assert(response.body.data.users, 'Users array should be present');
  assert.strictEqual(response.body.data.users.length, 2);
});

test('User Routes - Get User By ID', async (t) => {
  const app = express();
  app.use(express.json());

  const userRoutes = createUserRoutes({
    userController: mockUserController
  } as UserDependencies);


  userRoutes.stack[0].handle = mockAuthenticateToken;

  app.use('/api/v1/users', userRoutes);

  const response = await request(app)
    .get('/api/v1/users/507f1f77bcf86cd799439011')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'User retrieved successfully');
  assert(response.body.data, 'User data should be present');
  assert.strictEqual(response.body.data._id, '507f1f77bcf86cd799439011');
});

test('User Routes - Update Profile', async (t) => {
  const app = express();
  app.use(express.json());

  const userRoutes = createUserRoutes({
    userController: mockUserController
  } as UserDependencies);


  userRoutes.stack[0].handle = mockAuthenticateToken;

  app.use('/api/v1/users', userRoutes);

  const response = await request(app)
    .put('/api/v1/users/profile')
    .send({
      name: 'Updated User',
      mobile: '9876543210'
    })
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Profile updated successfully');
  assert(response.body.data, 'Updated user data should be present');
  assert.strictEqual(response.body.data.name, 'Updated User');
  assert.strictEqual(response.body.data.mobile, '9876543210');
});

test('User Routes - Delete User (Admin deleting regular user)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthAdmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
    next();
  };
  
  testRouter.use(mockAuthAdmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439012')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'User deleted successfully');
});

test('User Routes - Delete User (Admin cannot delete themselves)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthAdmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
    next();
  };
  
  testRouter.use(mockAuthAdmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439011')
    .expect(403);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'You cannot delete your own account');
});

test('User Routes - Delete User (Admin cannot delete another admin)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthAdmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
    next();
  };
  
  testRouter.use(mockAuthAdmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439013')
    .expect(403);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Admins cannot delete other admins');
});

test('User Routes - Delete User (Admin cannot delete superadmin)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthAdmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: 'admin' };
    next();
  };
  
  testRouter.use(mockAuthAdmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439014')
    .expect(403);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Admins cannot delete superadmins');
});

test('User Routes - Delete User (Superadmin deleting regular user)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthSuperadmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439014', role: 'superadmin' };
    next();
  };
  
  testRouter.use(mockAuthSuperadmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439012')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'User deleted successfully');
});

test('User Routes - Delete User (Superadmin deleting admin)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthSuperadmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439014', role: 'superadmin' };
    next();
  };
  
  testRouter.use(mockAuthSuperadmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439013')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'User deleted successfully');
});

test('User Routes - Delete User (Superadmin cannot delete themselves)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthSuperadmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439014', role: 'superadmin' };
    next();
  };
  
  testRouter.use(mockAuthSuperadmin);
  testRouter.use(mockRequireRole(['admin', 'superadmin']));
  testRouter.delete('/:id', mockUserController.deleteUser);
  
  app.use('/api/v1/users', testRouter);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439014')
    .expect(403);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'You cannot delete your own account');
});

test('User Routes - Delete User (Superadmin cannot delete another superadmin)', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  const mockAuthSuperadmin = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439014', role: 'superadmin' };
    next();
  };
  
  // Mock another superadmin
  const mockUserRoles: Record<string, string> = {
    '507f1f77bcf86cd799439015': 'superadmin'
  };

  const testRouterWithSuperadmin = express.Router();
  testRouterWithSuperadmin.use(mockAuthSuperadmin);
  testRouterWithSuperadmin.use(mockRequireRole(['admin', 'superadmin']));
  testRouterWithSuperadmin.delete('/:id', async (req: any, res: any) => {
    const userIdToDelete = req.params.id;
    const requesterUserId = req.user?.userId;
    
    if (userIdToDelete === requesterUserId) {
      res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
      return;
    }

    const userToDeleteRole = mockUserRoles[userIdToDelete] || 'user';

    if (userToDeleteRole === 'superadmin') {
      res.status(403).json({
        success: false,
        message: 'Superadmins cannot delete other superadmins'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });
  
  app.use('/api/v1/users', testRouterWithSuperadmin);

  const response = await request(app)
    .delete('/api/v1/users/507f1f77bcf86cd799439015')
    .expect(403);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Superadmins cannot delete other superadmins');
});

test('User Routes - Authentication Required', async (t) => {
  const app = express();
  app.use(express.json());

  const userRoutes = createUserRoutes({
    userController: mockUserController
  } as UserDependencies);

  const mockAuthReject = async (req: any, res: any, next: any) => {
    res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  };

  userRoutes.stack[0].handle = mockAuthReject;

  app.use('/api/v1/users', userRoutes);

  const response = await request(app)
    .get('/api/v1/users/profile')
    .expect(401);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Access token is required');
});

test('User Routes - Role Based Access Control', async (t) => {
  const app = express();
  app.use(express.json());

  const userRoutes = createUserRoutes({
    userController: mockUserController
  } as UserDependencies);

  const mockAuthUser = async (req: any, res: any, next: any) => {
    req.user = { userId: '507f1f77bcf86cd799439011', role: 'user' };
    next();
  };

  userRoutes.stack[0].handle = mockAuthUser;
  userRoutes.stack[1].handle = mockRequireRole(['admin', 'superadmin']);

  app.use('/api/v1/users', userRoutes);

  const response = await request(app)
    .get('/api/v1/users')
    .expect(403);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Insufficient permissions');
});
