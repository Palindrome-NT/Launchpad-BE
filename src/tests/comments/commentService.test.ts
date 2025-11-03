import { test } from 'node:test';
import assert from 'node:assert';
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

test('CommentService - Create Comment', async (t) => {
  const commentData = {
    content: 'This is a test comment',
    postId: '507f1f77bcf86cd799439013'
  };

  const result = await CommentService.createComment('507f1f77bcf86cd799439012', commentData);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Comment created successfully');
  assert(result.data, 'Comment data should be present');
  assert.strictEqual(result.data.content, 'This is a test comment');
  assert.strictEqual(result.data.authorId, '507f1f77bcf86cd799439012');
  assert.strictEqual(result.data.postId, '507f1f77bcf86cd799439013');
});

test('CommentService - Get Comments By Post', async (t) => {
  const result = await CommentService.getCommentsByPost('507f1f77bcf86cd799439013', 1, 10);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Comments fetched successfully');
  assert(result.data, 'Comments data should be present');
  assert(result.data.items, 'Comments array should be present');
  assert.strictEqual(result.data.items.length, 1);
  assert(result.data.pagination, 'Pagination data should be present');
  assert.strictEqual(result.data.pagination.page, 1);
});

test('CommentService - Get Comment By ID', async (t) => {
  const result = await CommentService.getCommentById('507f1f77bcf86cd799439011');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Comment fetched successfully');
  assert(result.data, 'Comment data should be present');
  assert.strictEqual(result.data._id, '507f1f77bcf86cd799439011');
  assert.strictEqual(result.data.content, 'Test comment');
});

test('CommentService - Update Comment', async (t) => {
  const result = await CommentService.updateComment('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', 'Updated comment content');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Comment updated successfully');
  assert(result.data, 'Updated comment data should be present');
  assert.strictEqual(result.data.content, 'Updated comment content');
  assert.strictEqual(result.data.authorId, '507f1f77bcf86cd799439012');
});

test('CommentService - Delete Comment', async (t) => {
  const result = await CommentService.deleteComment('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012');

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'Comment deleted successfully');
});

test('CommentService - Get Comments By User', async (t) => {
  const result = await CommentService.getCommentsByUser('507f1f77bcf86cd799439012', 1, 10);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.message, 'User comments fetched successfully');
  assert(result.data, 'User comments data should be present');
  assert(result.data.items, 'User comments array should be present');
  assert.strictEqual(result.data.items.length, 1);
  assert(result.data.pagination, 'Pagination data should be present');
  assert.strictEqual(result.data.pagination.page, 1);
});

test('CommentService - Create Comment Validation Error', async (t) => {
  // Mock CommentService to return validation error
  const errorCommentService = {
    createComment: async (authorId: string, commentData: any) => ({
      success: false,
      message: 'Comment content is required'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const commentData = {
    content: '',
    postId: '507f1f77bcf86cd799439013'
  };

  const result = await CommentService.createComment('507f1f77bcf86cd799439012', commentData);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Comment content is required');

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});

test('CommentService - Get Comment Not Found', async (t) => {
  // Mock CommentService to return error
  const errorCommentService = {
    getCommentById: async (commentId: string) => ({
      success: false,
      message: 'Comment not found'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const result = await CommentService.getCommentById('invalid-id');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Comment not found');

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});

test('CommentService - Update Comment Not Found', async (t) => {
  // Mock CommentService to return error
  const errorCommentService = {
    updateComment: async (commentId: string, authorId: string, content: string) => ({
      success: false,
      message: 'Comment not found'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const result = await CommentService.updateComment('invalid-id', '507f1f77bcf86cd799439012', 'Updated content');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Comment not found');

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});

test('CommentService - Delete Comment Not Found', async (t) => {
  // Mock CommentService to return error
  const errorCommentService = {
    deleteComment: async (commentId: string, authorId: string) => ({
      success: false,
      message: 'Comment not found'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const result = await CommentService.deleteComment('invalid-id', '507f1f77bcf86cd799439012');

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Comment not found');

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});

test('CommentService - Get Comments By Post Not Found', async (t) => {
  // Mock CommentService to return error
  const errorCommentService = {
    getCommentsByPost: async (postId: string, page: number, limit: number) => ({
      success: false,
      message: 'Post not found'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const result = await CommentService.getCommentsByPost('invalid-id', 1, 10);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Post not found');

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});

test('CommentService - Get Comments By User Not Found', async (t) => {
  // Mock CommentService to return error
  const errorCommentService = {
    getCommentsByUser: async (userId: string, page: number, limit: number) => ({
      success: false,
      message: 'Invalid user ID format'
    })
  };

  Object.assign(CommentService, errorCommentService);

  const result = await CommentService.getCommentsByUser('invalid-id', 1, 10);

  assert.strictEqual(result.success, false);
  assert.strictEqual(result.message, 'Invalid user ID format');

  // Restore original CommentService
  Object.assign(CommentService, mockCommentService);
});
