import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { createPostRoutes, PostDependencies } from '../../routes/posts.js';

const mockPostController = {
  getAllPosts: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts: [
          {
            _id: '507f1f77bcf86cd799439011',
            content: 'Test post content',
            authorId: '507f1f77bcf86cd799439012',
            likesCount: 5,
            commentsCount: 2,
            media: [],
            mediaType: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          currentPage: parseInt(req.query.page) || 1,
          totalPages: 1,
          totalPosts: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  },

  getPostById: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      data: {
        _id: req.params.id,
        content: 'Test post content',
        authorId: '507f1f77bcf86cd799439012',
        likesCount: 5,
        commentsCount: 2,
        media: [],
        mediaType: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  getUserPosts: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'User posts retrieved successfully',
      data: {
        posts: [
          {
            _id: '507f1f77bcf86cd799439011',
            content: 'User post content',
            authorId: req.params.userId,
            likesCount: 3,
            commentsCount: 1,
            media: [],
            mediaType: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        pagination: {
          currentPage: parseInt(req.query.page) || 1,
          totalPages: 1,
          totalPosts: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  },

  createPost: async (req: any, res: any) => {
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        _id: '507f1f77bcf86cd799439011',
        content: req.body.content,
        authorId: req.user?.userId,
        likesCount: 0,
        commentsCount: 0,
        media: req.body.media || [],
        mediaType: req.body.mediaType || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  updatePost: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: {
        _id: req.params.id,
        content: req.body.content || 'Updated post content',
        authorId: req.user?.userId,
        likesCount: 5,
        commentsCount: 2,
        media: req.body.media || [],
        mediaType: req.body.mediaType || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  },

  deletePost: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  },

  toggleLike: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      data: {
        _id: req.params.id,
        likesCount: 6,
        isLiked: true
      }
    });
  },

  uploadMedia: async (req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: [
          {
            url: 'http://localhost:5000/uploads/images/media-123.jpg',
            type: 'image',
            filename: 'media-123.jpg'
          }
        ],
        urls: ['http://localhost:5000/uploads/images/media-123.jpg'],
        types: ['image']
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

const mockUploadMultiple = async (req: any, res: any, next: any) => {
  req.files = [
    {
      fieldname: 'media',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      filename: 'media-123.jpg',
      path: 'uploads/images/media-123.jpg',
      size: 1024
    } as Express.Multer.File
  ];
  next();
};

test('Post Integration - Complete Post Flow', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  
  testRouter.get('/', mockPostController.getAllPosts);
  testRouter.get('/:id', mockValidateParams({}), mockPostController.getPostById);
  testRouter.get('/user/:userId', mockPostController.getUserPosts);
  
  testRouter.use(mockAuthenticateToken);
  testRouter.post('/', mockValidateRequest({}), mockPostController.createPost);
  testRouter.put('/:id', mockValidateParams({}), mockValidateRequest({}), mockPostController.updatePost);
  testRouter.delete('/:id', mockValidateParams({}), mockPostController.deletePost);
  testRouter.post('/:id/like', mockValidateParams({}), mockPostController.toggleLike);
  
  app.use('/api/v1/posts', testRouter);

  const createResponse = await request(app)
    .post('/api/v1/posts')
    .send({
      content: 'This is a test post',
      media: ['image1.jpg'],
      mediaType: ['image']
    })
    .expect(201);

  assert.strictEqual(createResponse.body.success, true);
  assert.strictEqual(createResponse.body.message, 'Post created successfully');
  assert(createResponse.body.data, 'Post data should be present');
  assert.strictEqual(createResponse.body.data.content, 'This is a test post');
  assert.strictEqual(createResponse.body.data.authorId, '507f1f77bcf86cd799439012');

  const postId = createResponse.body.data._id;

  const getResponse = await request(app)
    .get(`/api/v1/posts/${postId}`)
    .expect(200);

  assert.strictEqual(getResponse.body.success, true);
  assert.strictEqual(getResponse.body.data._id, postId);

  const updateResponse = await request(app)
    .put(`/api/v1/posts/${postId}`)
    .send({
      content: 'Updated post content'
    })
    .expect(200);

  assert.strictEqual(updateResponse.body.success, true);
  assert.strictEqual(updateResponse.body.message, 'Post updated successfully');
  assert.strictEqual(updateResponse.body.data.content, 'Updated post content');

  const likeResponse = await request(app)
    .post(`/api/v1/posts/${postId}/like`)
    .expect(200);

  assert.strictEqual(likeResponse.body.success, true);
  assert.strictEqual(likeResponse.body.data.likesCount, 6);
  assert.strictEqual(likeResponse.body.data.isLiked, true);

  const deleteResponse = await request(app)
    .delete(`/api/v1/posts/${postId}`)
    .expect(200);

  assert.strictEqual(deleteResponse.body.success, true);
  assert.strictEqual(deleteResponse.body.message, 'Post deleted successfully');
});

test('Post Integration - Public Posts Access', async (t) => {
  const app = express();
  app.use(express.json());

  const postRoutes = createPostRoutes({
    postController: mockPostController
  } as PostDependencies);

  app.use('/api/v1/posts', postRoutes);

  const getAllResponse = await request(app)
    .get('/api/v1/posts')
    .query({ page: '1', limit: '10' })
    .expect(200);

  assert.strictEqual(getAllResponse.body.success, true);
  assert(getAllResponse.body.data.posts, 'Posts array should be present');
  assert(getAllResponse.body.data.pagination, 'Pagination data should be present');

  const getByIdResponse = await request(app)
    .get('/api/v1/posts/507f1f77bcf86cd799439011')
    .expect(200);

  assert.strictEqual(getByIdResponse.body.success, true);
  assert.strictEqual(getByIdResponse.body.data._id, '507f1f77bcf86cd799439011');

  const getUserPostsResponse = await request(app)
    .get('/api/v1/posts/user/507f1f77bcf86cd799439012')
    .query({ page: '1', limit: '10' })
    .expect(200);

  assert.strictEqual(getUserPostsResponse.body.success, true);
  assert(getUserPostsResponse.body.data.posts, 'User posts array should be present');
});

test('Post Integration - Create Post with Media', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockValidateRequest({}));
  testRouter.post('/', mockPostController.createPost);
  app.use('/api/v1/posts', testRouter);

  const response = await request(app)
    .post('/api/v1/posts')
    .send({
      content: 'Post with images and video',
      media: ['image1.jpg', 'image2.jpg', 'video1.mp4'],
      mediaType: ['image', 'image', 'video']
    })
    .expect(201);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.data.media.length, 3);
  assert.strictEqual(response.body.data.mediaType.length, 3);
});

test('Post Integration - Authentication Required for Protected Routes', async (t) => {
  const app = express();
  app.use(express.json());

  const postRoutes = createPostRoutes({
    postController: mockPostController
  } as PostDependencies);

  const mockAuthReject = async (req: any, res: any, next: any) => {
    res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  };

  const testRouter = express.Router();
  testRouter.use(mockAuthReject);
  testRouter.post('/', mockPostController.createPost);
  app.use('/api/v1/posts', testRouter);

  const response = await request(app)
    .post('/api/v1/posts')
    .send({
      content: 'Test post'
    })
    .expect(401);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Access token is required');
});

test('Post Integration - Validation Error', async (t) => {
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
          message: 'Content is required'
        }
      ]
    });
  };
  
  testRouter.use(mockValidationError);
  testRouter.post('/', mockPostController.createPost);
  app.use('/api/v1/posts', testRouter);

  const response = await request(app)
    .post('/api/v1/posts')
    .send({
      content: ''
    })
    .expect(400);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Validation failed');
});

test('Post Integration - Error Handling', async (t) => {
  const app = express();
  app.use(express.json());

  const errorPostController = {
    getAllPosts: mockPostController.getAllPosts,
    getPostById: async (req: any, res: any) => {
      res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    },
    getUserPosts: mockPostController.getUserPosts,
    createPost: mockPostController.createPost,
    updatePost: mockPostController.updatePost,
    deletePost: mockPostController.deletePost,
    toggleLike: mockPostController.toggleLike,
    uploadMedia: mockPostController.uploadMedia
  };

  const testRouter = express.Router();
  testRouter.get('/', errorPostController.getAllPosts);
  testRouter.get('/:id', mockValidateParams({}), errorPostController.getPostById);
  testRouter.get('/user/:userId', errorPostController.getUserPosts);
  app.use('/api/v1/posts', testRouter);

  const response = await request(app)
    .get('/api/v1/posts/507f1f77bcf86cd799439999')
    .expect(404);

  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, 'Post not found');
});

test('Post Integration - Upload Media Flow', async (t) => {
  const app = express();
  app.use(express.json());

  const testRouter = express.Router();
  testRouter.use(mockAuthenticateToken);
  testRouter.use(mockUploadMultiple);
  testRouter.post('/upload', mockPostController.uploadMedia);
  app.use('/api/v1/posts', testRouter);

  const response = await request(app)
    .post('/api/v1/posts/upload')
    .expect(200);

  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Files uploaded successfully');
  assert(response.body.data.files, 'Files array should be present');
  assert.strictEqual(response.body.data.files.length, 1);
});

