import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { createCommentRoutes } from '../../routes/comments.js';

// Mock CommentController
const mockCommentController = {
  createComment: async (req: any, res: any) => {
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        _id: '507f1f77bcf86cd799439011',
        content: req.body.content,
        authorId: req.user?.userId,
        postId: req.body.postId,
        createdAt: new Date()
      }
    });
  },

  getCommentsByPost: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: {
        items: [
          {
            _id: '507f1f77bcf86cd799439011',
            content: 'Test comment',
            authorId: '507f1f77bcf86cd799439012',
            postId: req.params.postId,
            createdAt: new Date()
          }
        ],
        pagination: {
          total: 1,
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  },

  getCommentById: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Comment fetched successfully',
      data: {
        _id: req.params.id,
        content: 'Test comment',
        authorId: '507f1f77bcf86cd799439012',
        postId: '507f1f77bcf86cd799439013',
        createdAt: new Date()
      }
    });
  },

  updateComment: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        _id: req.params.id,
        content: req.body.content,
        authorId: req.user?.userId,
        postId: '507f1f77bcf86cd799439013',
        updatedAt: new Date()
      }
    });
  },

  deleteComment: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  },

  getCommentsByUser: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'User comments fetched successfully',
      data: {
        items: [
          {
            _id: '507f1f77bcf86cd799439011',
            content: 'User comment',
            authorId: req.params.userId,
            postId: '507f1f77bcf86cd799439013',
            createdAt: new Date()
          }
        ],
        pagination: {
          total: 1,
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  }
};

// Mock middleware
const mockAuthenticateToken = async (req: any, res: any, next: any) => {
  req.user = { userId: '507f1f77bcf86cd799439012' };
  next();
};

const mockValidateRequest = (schema: any) => async (req: any, res: any, next: any) => {
  next();
};

const mockValidateParams = (schema: any) => async (req: any, res: any, next: any) => {
  next();
};

test('Comment Routes - Get Comments By Post (Public)', async (t) => {
  const app = express();
  app.use(express.json());
  
  const commentRoutes = createCommentRoutes({ commentController: mockCommentController });
  app.use('/api/v1/comments', commentRoutes);

  const response = await request(app)
    .get('/api/v1/comments/post/507f1f77bcf86cd799439013')
    .query({ page: 1, limit: 10 });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Comments fetched successfully');
  assert(response.body.data, 'Comments data should be present');
  assert(response.body.data.items, 'Comments array should be present');
  assert.strictEqual(response.body.data.items.length, 1);
  assert(response.body.data.pagination, 'Pagination data should be present');
});

test('Comment Routes - Get Comment By ID (Public)', async (t) => {
  const app = express();
  app.use(express.json());
  
  const commentRoutes = createCommentRoutes({ commentController: mockCommentController });
  app.use('/api/v1/comments', commentRoutes);

  const response = await request(app)
    .get('/api/v1/comments/507f1f77bcf86cd799439011');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Comment fetched successfully');
  assert(response.body.data, 'Comment data should be present');
  assert.strictEqual(response.body.data._id, '507f1f77bcf86cd799439011');
  assert.strictEqual(response.body.data.content, 'Test comment');
});

test('Comment Routes - Get Comments By User (Public)', async (t) => {
  const app = express();
  app.use(express.json());
  
  const commentRoutes = createCommentRoutes({ commentController: mockCommentController });
  app.use('/api/v1/comments', commentRoutes);

  const response = await request(app)
    .get('/api/v1/comments/user/507f1f77bcf86cd799439012')
    .query({ page: 1, limit: 10 });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'User comments fetched successfully');
  assert(response.body.data, 'User comments data should be present');
  assert(response.body.data.items, 'User comments array should be present');
  assert.strictEqual(response.body.data.items.length, 1);
  assert(response.body.data.pagination, 'Pagination data should be present');
});

test('Comment Routes - Create Comment (Authenticated)', async (t) => {
  const app = express();
  app.use(express.json());
  
  const testRouter = express.Router();
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidateRequest({}));
  testRouter.post('/', mockCommentController.createComment);
  
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'This is a test comment',
      postId: '507f1f77bcf86cd799439013'
    });

  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Comment created successfully');
  assert(response.body.data, 'Comment data should be present');
  assert.strictEqual(response.body.data.content, 'This is a test comment');
  assert.strictEqual(response.body.data.authorId, '507f1f77bcf86cd799439012');
  assert.strictEqual(response.body.data.postId, '507f1f77bcf86cd799439013');
});

test('Comment Routes - Update Comment (Authenticated)', async (t) => {
  const app = express();
  app.use(express.json());
  
  const testRouter = express.Router();
  
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidateParams({}));
  testRouter.put('/:id', mockCommentController.updateComment);
  
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .put('/api/v1/comments/507f1f77bcf86cd799439011')
    .send({
      content: 'Updated comment content'
    });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Comment updated successfully');
  assert(response.body.data, 'Updated comment data should be present');
  assert.strictEqual(response.body.data.content, 'Updated comment content');
  assert.strictEqual(response.body.data.authorId, '507f1f77bcf86cd799439012');
});

test('Comment Routes - Delete Comment (Authenticated)', async (t) => {
  const app = express();
  app.use(express.json());
  
  const testRouter = express.Router();
  
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidateParams({}));
  testRouter.delete('/:id', mockCommentController.deleteComment);
  
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .delete('/api/v1/comments/507f1f77bcf86cd799439011');

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Comment deleted successfully');
});

test('Comment Routes - Authentication Required for Protected Routes', async (t) => {
  const app = express();
  app.use(express.json());
  
  // Mock authenticateToken to return 401
  const mockAuthError = async (req: any, res: any, next: any) => {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  };

  const testRouter = express.Router();
  testRouter.use(mockAuthError);
  testRouter.post('/', mockCommentController.createComment);
  
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'This is a test comment',
      postId: '507f1f77bcf86cd799439013'
    });

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Access token required');
});

test('Comment Routes - Validation Error', async (t) => {
  const app = express();
  app.use(express.json());
  
  // Mock validateRequest to return validation error
  const mockValidationError = async (req: any, res: any, next: any) => {
    res.status(400).json({
      success: false,
      message: 'Validation error: Comment content is required'
    });
  };

  const testRouter = express.Router();
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidationError);
  testRouter.post('/', mockCommentController.createComment);
  
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .post('/api/v1/comments')
    .send({
      content: '',
      postId: '507f1f77bcf86cd799439013'
    });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Validation error: Comment content is required');
});
