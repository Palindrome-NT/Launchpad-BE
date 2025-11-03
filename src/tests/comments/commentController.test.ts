import { test } from 'node:test';
import assert from 'node:assert';
import { CommentController } from '../../controllers/commentController.js';
import { CommentService } from '../../services/commentService.js';

// Mock CommentService
const mockCommentService = {
  createComment: async (authorId: string, commentData: any) => ({
    success: true,
    message: 'Comment created successfully',
    data: {
      _id: '507f1f77bcf86cd799439011',
      content: commentData.content,
      authorId: authorId,
      postId: commentData.postId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }),

  getCommentsByPost: async (postId: string, page: number, limit: number) => ({
    success: true,
    message: 'Comments fetched successfully',
    data: {
      items: [
        {
          _id: '507f1f77bcf86cd799439011',
          content: 'Test comment',
          authorId: '507f1f77bcf86cd799439012',
          postId: postId,
          createdAt: new Date()
        }
      ],
      pagination: {
        total: 1,
        page: page,
        limit: limit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  }),

  getCommentById: async (commentId: string) => ({
    success: true,
    message: 'Comment fetched successfully',
    data: {
      _id: commentId,
      content: 'Test comment',
      authorId: '507f1f77bcf86cd799439012',
      postId: '507f1f77bcf86cd799439013',
      createdAt: new Date()
    }
  }),

  updateComment: async (commentId: string, authorId: string, content: string) => ({
    success: true,
    message: 'Comment updated successfully',
    data: {
      _id: commentId,
      content: content,
      authorId: authorId,
      postId: '507f1f77bcf86cd799439013',
      updatedAt: new Date()
    }
  }),

  deleteComment: async (commentId: string, authorId: string) => ({
    success: true,
    message: 'Comment deleted successfully'
  }),

  getCommentsByUser: async (userId: string, page: number, limit: number) => ({
    success: true,
    message: 'User comments fetched successfully',
    data: {
      items: [
        {
          _id: '507f1f77bcf86cd799439011',
          content: 'User comment',
          authorId: userId,
          postId: '507f1f77bcf86cd799439013',
          createdAt: new Date()
        }
      ],
      pagination: {
        total: 1,
        page: page,
        limit: limit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  })
};

// Mock the CommentService module
Object.assign(CommentService, mockCommentService);

test('CommentController - Create Comment', async (t) => {
  const mockRequest = {
    user: { userId: '507f1f77bcf86cd799439012' },
    body: {
      content: 'This is a test comment',
      postId: '507f1f77bcf86cd799439013'
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 201);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'Comment created successfully');
        assert(data.data, 'Comment data should be present');
        assert.strictEqual(data.data.content, 'This is a test comment');
        assert.strictEqual(data.data.authorId, '507f1f77bcf86cd799439012');
        assert.strictEqual(data.data.postId, '507f1f77bcf86cd799439013');
      }
    })
  };

  await CommentController.createComment(mockRequest as any, mockResponse as any);
});

test('CommentController - Get Comments By Post', async (t) => {
  const mockRequest = {
    params: { postId: '507f1f77bcf86cd799439013' },
    query: { page: '1', limit: '10' }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'Comments fetched successfully');
        assert(data.data, 'Comments data should be present');
        assert(data.data.items, 'Comments array should be present');
        assert.strictEqual(data.data.items.length, 1);
        assert(data.data.pagination, 'Pagination data should be present');
      }
    })
  };

  await CommentController.getCommentsByPost(mockRequest as any, mockResponse as any);
});

test('CommentController - Get Comment By ID', async (t) => {
  const mockRequest = {
    params: { id: '507f1f77bcf86cd799439011' }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'Comment fetched successfully');
        assert(data.data, 'Comment data should be present');
        assert.strictEqual(data.data._id, '507f1f77bcf86cd799439011');
        assert.strictEqual(data.data.content, 'Test comment');
      }
    })
  };

  await CommentController.getCommentById(mockRequest as any, mockResponse as any);
});

test('CommentController - Update Comment', async (t) => {
  const mockRequest = {
    params: { id: '507f1f77bcf86cd799439011' },
    user: { userId: '507f1f77bcf86cd799439012' },
    body: { content: 'Updated comment content' }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'Comment updated successfully');
        assert(data.data, 'Updated comment data should be present');
        assert.strictEqual(data.data.content, 'Updated comment content');
        assert.strictEqual(data.data.authorId, '507f1f77bcf86cd799439012');
      }
    })
  };

  await CommentController.updateComment(mockRequest as any, mockResponse as any);
});

test('CommentController - Delete Comment', async (t) => {
  const mockRequest = {
    params: { id: '507f1f77bcf86cd799439011' },
    user: { userId: '507f1f77bcf86cd799439012' }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'Comment deleted successfully');
      }
    })
  };

  await CommentController.deleteComment(mockRequest as any, mockResponse as any);
});

test('CommentController - Get Comments By User', async (t) => {
  const mockRequest = {
    params: { userId: '507f1f77bcf86cd799439012' },
    query: { page: '1', limit: '10' }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'User comments fetched successfully');
        assert(data.data, 'User comments data should be present');
        assert(data.data.items, 'User comments array should be present');
        assert.strictEqual(data.data.items.length, 1);
        assert(data.data.pagination, 'Pagination data should be present');
      }
    })
  };

  await CommentController.getCommentsByUser(mockRequest as any, mockResponse as any);
});

test('CommentController - Error Handling', async (t) => {
  // Mock CommentService to return error
  const errorCommentService = {
    createComment: async (authorId: string, commentData: any) => ({
      success: false,
      message: 'Failed to create comment'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const mockRequest = {
    user: { userId: '507f1f77bcf86cd799439012' },
    body: {
      content: 'This is a test comment',
      postId: '507f1f77bcf86cd799439013'
    }
  };

  const mockResponse = {
    status: (code: number) => ({
      json: (data: any) => {
        assert.strictEqual(code, 500);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Failed to create comment');
      }
    })
  };

  await CommentController.createComment(mockRequest as any, mockResponse as any);

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});
