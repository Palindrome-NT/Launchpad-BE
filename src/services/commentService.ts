import mongoose from 'mongoose';
import { Comment } from '../models/Comment';
import { Post } from '../models/Post';
import { PostService } from './postService';
import { PaginationResult, CommentCreationData, ServiceResponse } from './types';

export class CommentService {
  /**
   * Create a new comment
   */
  static async createComment(authorId: string, commentData: CommentCreationData): Promise<ServiceResponse<any>> {
    try {
      const { content, postId } = commentData;

      // Validate content
      if (!content?.trim()) {
        return {
          success: false,
          message: 'Comment content is required',
        };
      }

      if (content.length > 500) {
        return {
          success: false,
          message: 'Comment content cannot exceed 500 characters',
        };
      }

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return {
          success: false,
          message: 'Invalid post ID format',
        };
      }

      // Verify post exists and is not deleted
      const post = await Post.findOne({
        _id: postId,
        isDeleted: false
      });

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create comment
        const comment = new Comment({
          content: content.trim(),
          authorId,
          postId,
        });

        await comment.save({ session });

        // Update post comments count
        await PostService.incrementCommentsCount(postId);

        await session.commitTransaction();

        // Populate author information
        await comment.populate('authorId', 'name email mobile');

        return {
          success: true,
          message: 'Comment created successfully',
          data: comment,
        };
      } catch (error: any) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error: any) {
      console.error('Create comment error:', error);
      return {
        success: false,
        message: 'Failed to create comment',
        error: error.message,
      };
    }
  }

  /**
   * Get comments for a post with pagination
   */
  static async getCommentsByPost(postId: string, page: number = 1, limit: number = 10): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return {
          success: false,
          message: 'Invalid post ID format',
        };
      }

      // Verify post exists
      const post = await Post.findOne({
        _id: postId,
        isDeleted: false
      });

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      const skip = (page - 1) * limit;

      const comments = await Comment.find({
        postId,
        isDeleted: false,
      })
        .populate('authorId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Comment.countDocuments({
        postId,
        isDeleted: false,
      });

      return {
        success: true,
        message: 'Comments fetched successfully',
        data: {
          items: comments,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Get comments by post error:', error);
      return {
        success: false,
        message: 'Failed to fetch comments',
        error: error.message,
      };
    }
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(commentId: string): Promise<ServiceResponse<any>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return {
          success: false,
          message: 'Invalid comment ID format',
        };
      }

      const comment = await Comment.findOne({
        _id: commentId,
        isDeleted: false,
      })
        .populate('authorId', 'name email mobile')
        .populate('postId', 'content');

      if (!comment) {
        return {
          success: false,
          message: 'Comment not found',
        };
      }

      return {
        success: true,
        message: 'Comment fetched successfully',
        data: comment,
      };
    } catch (error: any) {
      console.error('Get comment by ID error:', error);
      return {
        success: false,
        message: 'Failed to fetch comment',
        error: error.message,
      };
    }
  }

  /**
   * Update comment
   */
  static async updateComment(commentId: string, authorId: string, content: string): Promise<ServiceResponse<any>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return {
          success: false,
          message: 'Invalid comment ID format',
        };
      }

      if (!content?.trim()) {
        return {
          success: false,
          message: 'Comment content is required',
        };
      }

      if (content.length > 500) {
        return {
          success: false,
          message: 'Comment content cannot exceed 500 characters',
        };
      }

      // Find and verify ownership
      const comment = await Comment.findOne({
        _id: commentId,
        isDeleted: false,
      });

      if (!comment) {
        return {
          success: false,
          message: 'Comment not found',
        };
      }

      if (comment.authorId.toString() !== authorId) {
        return {
          success: false,
          message: 'You can only edit your own comments',
        };
      }

      // Update comment
      comment.content = content.trim();
      await comment.save();

      // Populate author information
      await comment.populate('authorId', 'name email mobile');

      return {
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      };
    } catch (error: any) {
      console.error('Update comment error:', error);
      return {
        success: false,
        message: 'Failed to update comment',
        error: error.message,
      };
    }
  }

  /**
   * Delete comment (soft delete)
   */
  static async deleteComment(commentId: string, authorId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return {
          success: false,
          message: 'Invalid comment ID format',
        };
      }

      // Find and verify ownership
      const comment = await Comment.findOne({
        _id: commentId,
        isDeleted: false,
      });

      if (!comment) {
        return {
          success: false,
          message: 'Comment not found',
        };
      }

      if (comment.authorId.toString() !== authorId) {
        return {
          success: false,
          message: 'You can only delete your own comments',
        };
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Soft delete the comment
        comment.isDeleted = true;
        await comment.save({ session });

        // Update post comments count
        await PostService.decrementCommentsCount(comment.postId.toString());

        await session.commitTransaction();

        return {
          success: true,
          message: 'Comment deleted successfully',
        };
      } catch (error: any) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error: any) {
      console.error('Delete comment error:', error);
      return {
        success: false,
        message: 'Failed to delete comment',
        error: error.message,
      };
    }
  }

  /**
   * Get comments by user with pagination
   */
  static async getCommentsByUser(userId: string, page: number = 1, limit: number = 10): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          message: 'Invalid user ID format',
        };
      }

      const skip = (page - 1) * limit;

      const comments = await Comment.find({
        authorId: userId,
        isDeleted: false,
      })
        .populate('authorId', 'name email mobile')
        .populate('postId', 'content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Comment.countDocuments({
        authorId: userId,
        isDeleted: false,
      });

      return {
        success: true,
        message: 'User comments fetched successfully',
        data: {
          items: comments,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Get comments by user error:', error);
      return {
        success: false,
        message: 'Failed to fetch user comments',
        error: error.message,
      };
    }
  }
}
