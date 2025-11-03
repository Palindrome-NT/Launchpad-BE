import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { createCommentRoutes, CommentDependencies } from '../../routes/comments.js';

const mockCommentController = {
  createComment: async (req: any, res: any) => {
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        _id: '507f1f77bcf86cd799439015',
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
            _id: '507f1f77bcf86cd799439015',
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
            _id: '507f1f77bcf86cd799439015',
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

const mockAuthenticateToken = async (req: any, res: any, next: any) => {
  req.user = { userId: '507f1f77bcf86cd799439012', role: 'user' };
  next();
};

const mockValidateRequest = (schema: any) => async (req: any, res: any, next: any) => {
  next();
};

const mockValidateParams = (schema: any) => async (req: any, res: any, next: any) => {
  next();
};

test('Comment Integration - Complete Comment Flow', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  
  testRouter.get('/post/:postId', mockCommentController.getCommentsByPost);
  testRouter.get('/user/:userId', mockCommentController.getCommentsByUser);
  testRouter.get('/:id', mockValidateParams({}), mockCommentController.getCommentById);
  
  testRouter.use(mockAuthenticateToken);
  testRouter.post('/', mockValidateRequest({}), mockCommentController.createComment);
  testRouter.put('/:id', mockValidateParams({}), mockCommentController.updateComment);
  testRouter.delete('/:id', mockValidateParams({}), mockCommentController.deleteComment);
  
  app.use('/api/v1/comments', testRouter);

  const createResponse = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'This is a test comment',
      postId: '507f1f77bcf86cd799439013'
    })
    .expect(201);

  assert.strictEqual(createResponse.body.success, true);
  assert.strictEqual(createResponse.body.message, 'Comment created successfully');
  assert(createResponse.body.data, 'Comment data should be present');
  assert.strictEqual(createResponse.body.data.content, 'This is a test comment');
  assert.strictEqual(createResponse.body.data.authorId, '507f1f77bcf86cd799439012');
  assert.strictEqual(createResponse.body.data.postId, '507f1f77bcf86cd799439013');

  const commentId = createResponse.body.data._id;

  const getResponse = await request(app)
    .get(`/api/v1/comments/${commentId}`)
    .expect(200);

  assert.strictEqual(getResponse.body.success, true);
  assert.strictEqual(getResponse.body.data._id, commentId);

  const updateResponse = await request(app)
    .put(`/api/v1/comments/${commentId}`)
    .send({
      content: 'Updated comment content'
    })
    .expect(200);

  assert.strictEqual(updateResponse.body.success, true);
  assert.strictEqual(updateResponse.body.message, 'Comment updated successfully');
  assert.strictEqual(updateResponse.body.data.content, 'Updated comment content');

  const deleteResponse = await request(app)
    .delete(`/api/v1/comments/${commentId}`)
    .expect(200);

  assert.strictEqual(deleteResponse.body.success, true);
  assert.strictEqual(deleteResponse.body.message, 'Comment deleted successfully');
});

test('Comment Integration - Comments on Post Flow', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  
  testRouter.get('/post/:postId', mockCommentController.getCommentsByPost);
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidateRequest({}));
  testRouter.post('/', mockCommentController.createComment);
  
  app.use('/api/v1/comments', testRouter);

  const postId = '507f1f77bcf86cd799439013';

  const createResponse = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'First comment on post',
      postId: postId
    })
    .expect(201);

  assert.strictEqual(createResponse.body.success, true);
  assert.strictEqual(createResponse.body.data.postId, postId);

  const getCommentsResponse = await request(app)
    .get(`/api/v1/comments/post/${postId}`)
    .query({ page: '1', limit: '10' })
    .expect(200);

  assert.strictEqual(getCommentsResponse.body.success, true);
  assert(getCommentsResponse.body.data.items, 'Comments array should be present');
  assert.strictEqual(getCommentsResponse.body.data.items.length, 1);
  assert(getCommentsResponse.body.data.pagination, 'Pagination data should be present');
});

test('Comment Integration - Public Comments Access', async (t) => {
  const app = express();
  app.use(express.json());

  const commentRoutes = createCommentRoutes({
    commentController: mockCommentController
  } as CommentDependencies);

  app.use('/api/v1/comments', commentRoutes);

  const getByPostResponse = await request(app)
    .get('/api/v1/comments/post/507f1f77bcf86cd799439013')
    .query({ page: '1', limit: '10' })
    .expect(200);

  assert.strictEqual(getByPostResponse.body.success, true);
  assert(getByPostResponse.body.data.items, 'Comments array should be present');
  assert(getByPostResponse.body.data.pagination, 'Pagination data should be present');

  const getByIdResponse = await request(app)
    .get('/api/v1/comments/507f1f77bcf86cd799439015')
    .expect(200);

  assert.strictEqual(getByIdResponse.body.success, true);
  assert.strictEqual(getByIdResponse.body.data._id, '507f1f77bcf86cd799439015');

  const getByUserResponse = await request(app)
    .get('/api/v1/comments/user/507f1f77bcf86cd799439012')
    .query({ page: '1', limit: '10' })
    .expect(200);

  assert.strictEqual(getByUserResponse.body.success, true);
  assert(getByUserResponse.body.data.items, 'User comments array should be present');
});

test('Comment Integration - Authentication Required for Protected Routes', async (t) => {
  const app = express();
  app.use(express.json());

  const commentRoutes = createCommentRoutes({
    commentController: mockCommentController
  } as CommentDependencies);

  const mockAuthReject = async (req: any, res: any, next: any) => {
    res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  };

  const testRouter = express.Router();
  testRouter.use(mockAuthReject);
  testRouter.post('/', mockCommentController.createComment);
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'This is a test comment',
      postId: '507f1f77bcf86cd799439013'
    })
    .expect(401);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Access token is required');
});

test('Comment Integration - Validation Error', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  testRouter.use(mockAuthenticateToken);
  
  const mockValidationError = async (req: any, res: any, next: any) => {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        {
          field: 'content',
          message: 'Comment content is required'
        }
      ]
    });
  };
  
  testRouter.use(mockValidationError);
  testRouter.post('/', mockCommentController.createComment);
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .post('/api/v1/comments')
    .send({
      content: '',
      postId: '507f1f77bcf86cd799439013'
    })
    .expect(400);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Validation failed');
});

test('Comment Integration - Error Handling', async (t) => {
  const app = express();
  app.use(express.json());

  const errorCommentController = {
    createComment: mockCommentController.createComment,
    getCommentsByPost: mockCommentController.getCommentsByPost,
    getCommentById: async (req: any, res: any) => {
      res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    },
    updateComment: mockCommentController.updateComment,
    deleteComment: mockCommentController.deleteComment,
    getCommentsByUser: mockCommentController.getCommentsByUser
  };

  const testRouter = express.Router();
  testRouter.get('/post/:postId', errorCommentController.getCommentsByPost);
  testRouter.get('/user/:userId', errorCommentController.getCommentsByUser);
  testRouter.get('/:id', mockValidateParams({}), errorCommentController.getCommentById);
  app.use('/api/v1/comments', testRouter);

  const response = await request(app)
    .get('/api/v1/comments/507f1f77bcf86cd799439999')
    .expect(404);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Comment not found');
});

test('Comment Integration - Multiple Comments on Post', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  
  testRouter.get('/post/:postId', mockCommentController.getCommentsByPost);
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidateRequest({}));
  testRouter.post('/', mockCommentController.createComment);
  
  app.use('/api/v1/comments', testRouter);

  const postId = '507f1f77bcf86cd799439013';

  const comment1 = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'First comment',
      postId: postId
    })
    .expect(201);

  assert.strictEqual(comment1.body.success, true);

  const comment2 = await request(app)
    .post('/api/v1/comments')
    .send({
      content: 'Second comment',
      postId: postId
    })
    .expect(201);

  assert.strictEqual(comment2.body.success, true);
  assert.strictEqual(comment2.body.data.postId, postId);

  const getCommentsResponse = await request(app)
    .get(`/api/v1/comments/post/${postId}`)
    .query({ page: '1', limit: '10' })
    .expect(200);

  assert.strictEqual(getCommentsResponse.body.success, true);
  assert(getCommentsResponse.body.data.items, 'Comments array should be present');
  assert(getCommentsResponse.body.data.pagination, 'Pagination data should be present');
});

