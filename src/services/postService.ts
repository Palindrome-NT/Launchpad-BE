import mongoose from 'mongoose';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { PaginationOptions, PaginationResult, PostCreationData, ServiceResponse } from './types';

export class PostService {
  static async createPost(authorId: string, postData: PostCreationData): Promise<ServiceResponse<any>> {
    try {
      const { content, media, mediaType } = postData;

      if (!content?.trim()) {
        return {
          success: false,
          message: 'Post content is required',
        };
      }

      if (content.length > 300) {
        return {
          success: false,
          message: 'Post content cannot exceed 300 characters',
        };
      }

      if (media && media.length > 0) {
        if (media.length > 5) {
          return {
            success: false,
            message: 'Maximum 5 media files allowed',
          };
        }

        if (!mediaType || media.length !== mediaType.length) {
          return {
            success: false,
            message: 'Media type is required for each media file',
          };
        }

        const validTypes = ['image', 'video'];
        for (const type of mediaType) {
          if (!validTypes.includes(type)) {
            return {
              success: false,
              message: 'Invalid media type. Only image and video are allowed',
            };
          }
        }
      }

      const post = new Post({
        content: content.trim(),
        authorId,
        media: media || [],
        mediaType: mediaType || [],
      });

      await post.save();

      await post.populate('authorId', 'name email mobile');

      return {
        success: true,
        message: 'Post created successfully',
        data: post,
      };
    } catch (error: any) {
      console.error('Create post error:', error);
      return {
        success: false,
        message: 'Failed to create post',
        error: error.message,
      };
    }
  }

  static async getAllPosts(options: PaginationOptions = {}): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      const { page = 1, limit = 10, search, author } = options;
      const skip = (page - 1) * limit;

      const query: any = { isDeleted: false };

      if (search) {
        query.content = { $regex: search, $options: 'i' };
      }

      if (author) {
        query.authorId = author;
      }

      const posts = await Post.find(query)
        .populate('authorId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments(query);

      return {
        success: true,
        message: 'Posts fetched successfully',
        data: {
          items: posts,
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
      console.error('Get all posts error:', error);
      return {
        success: false,
        message: 'Failed to fetch posts',
        error: error.message,
      };
    }
  }

  static async getPostById(postId: string): Promise<ServiceResponse<any>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return {
          success: false,
          message: 'Invalid post ID format',
        };
      }

      const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
      }).populate('authorId', 'name email mobile');

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      return {
        success: true,
        message: 'Post fetched successfully',
        data: post,
      };
    } catch (error: any) {
      console.error('Get post by ID error:', error);
      return {
        success: false,
        message: 'Failed to fetch post',
        error: error.message,
      };
    }
  }

  static async updatePost(postId: string, authorId: string, updateData: Partial<PostCreationData>): Promise<ServiceResponse<any>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return {
          success: false,
          message: 'Invalid post ID format',
        };
      }

      const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
      });

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      if (post.authorId.toString() !== authorId) {
        return {
          success: false,
          message: 'You can only edit your own posts',
        };
      }

      if (updateData.content && updateData.content.length > 300) {
        return {
          success: false,
          message: 'Post content cannot exceed 300 characters',
        };
      }

      if (updateData.media && updateData.media.length > 0) {
        if (updateData.media.length > 5) {
          return {
            success: false,
            message: 'Maximum 5 media files allowed',
          };
        }

        if (!updateData.mediaType || updateData.media.length !== updateData.mediaType.length) {
          return {
            success: false,
            message: 'Media type is required for each media file',
          };
        }
      }

      const finalUpdateData: any = {};
      if (updateData.content !== undefined) finalUpdateData.content = updateData.content.trim();
      if (updateData.media !== undefined) finalUpdateData.media = updateData.media;
      if (updateData.mediaType !== undefined) finalUpdateData.mediaType = updateData.mediaType;

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        finalUpdateData,
        { new: true, runValidators: true }
      ).populate('authorId', 'name email mobile');

      return {
        success: true,
        message: 'Post updated successfully',
        data: updatedPost,
      };
    } catch (error: any) {
      console.error('Update post error:', error);
      return {
        success: false,
        message: 'Failed to update post',
        error: error.message,
      };
    }
  }

  static async deletePost(postId: string, authorId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return {
          success: false,
          message: 'Invalid post ID format',
        };
      }

      const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
      });

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      if (post.authorId.toString() !== authorId) {
        return {
          success: false,
          message: 'You can only delete your own posts',
        };
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        post.isDeleted = true;
        await post.save({ session });

        await Comment.updateMany(
          { postId, isDeleted: false },
          { isDeleted: true },
          { session }
        );

        await session.commitTransaction();

        return {
          success: true,
          message: 'Post and related comments deleted successfully',
        };
      } catch (error: any) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error: any) {
      console.error('Delete post error:', error);
      return {
        success: false,
        message: 'Failed to delete post',
        error: error.message,
      };
    }
  }

  static async getUserPosts(userId: string, page: number = 1, limit: number = 10): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return {
          success: false,
          message: 'Invalid user ID format',
        };
      }

      const skip = (page - 1) * limit;

      const posts = await Post.find({
        authorId: userId,
        isDeleted: false,
      })
        .populate('authorId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Post.countDocuments({
        authorId: userId,
        isDeleted: false,
      });

      return {
        success: true,
        message: 'User posts fetched successfully',
        data: {
          items: posts,
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
      console.error('Get user posts error:', error);
      return {
        success: false,
        message: 'Failed to fetch user posts',
        error: error.message,
      };
    }
  }

  static async toggleLike(postId: string): Promise<ServiceResponse<{ likesCount: number }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return {
          success: false,
          message: 'Invalid post ID format',
        };
      }

      const post = await Post.findOne({
        _id: postId,
        isDeleted: false,
      });

      if (!post) {
        return {
          success: false,
          message: 'Post not found',
        };
      }

      post.likesCount += 1;
      await post.save();

      return {
        success: true,
        message: 'Post liked successfully',
        data: {
          likesCount: post.likesCount,
        },
      };
    } catch (error: any) {
      console.error('Toggle like error:', error);
      return {
        success: false,
        message: 'Failed to toggle like',
        error: error.message,
      };
    }
  }

  static async incrementCommentsCount(postId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

      return {
        success: true,
        message: 'Comments count updated successfully',
      };
    } catch (error: any) {
      console.error('Increment comments count error:', error);
      return {
        success: false,
        message: 'Failed to update comments count',
        error: error.message,
      };
    }
  }

  static async decrementCommentsCount(postId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });

      return {
        success: true,
        message: 'Comments count updated successfully',
      };
    } catch (error: any) {
      console.error('Decrement comments count error:', error);
      return {
        success: false,
        message: 'Failed to update comments count',
        error: error.message,
      };
    }
  }
}
