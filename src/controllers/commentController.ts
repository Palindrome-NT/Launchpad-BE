import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CommentService } from '../services/commentService';
import { AuthenticatedRequest } from '../middlewares/auth';
import { emitNewComment } from '../utils/socketBus';

export class CommentController {
  // Create a new comment
  static async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CommentService.createComment(req.user?.userId!, req.body);

      if (result.success) {
        try {
          const created = (result as any).data?.comment || (result as any).data || {};
          if (created && created._id) {
            emitNewComment({
              commentId: created._id.toString(),
              postId: created.postId?.toString?.() || created.postId,
              authorId: req.user?.userId!,
              content: created.content,
            });
          }
        } catch (_) {}
        res.status(201).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('validation') || result.message?.includes('required') || result.message?.includes('invalid')) {
          res.status(400).json(result);
        } else if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else {
          res.status(500).json(result);
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get comments for a post with pagination
  static async getCommentsByPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await CommentService.getCommentsByPost(postId, page, limit);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('invalid') || result.message?.includes('format')) {
          res.status(400).json(result);
        } else {
          res.status(500).json(result);
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get comment by ID
  static async getCommentById(req: Request, res: Response): Promise<void> {
    try {
      const result = await CommentService.getCommentById(req.params.id);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('invalid') || result.message?.includes('format')) {
          res.status(400).json(result);
        } else {
          res.status(500).json(result);
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update comment
  static async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CommentService.updateComment(req.params.id, req.user?.userId!, req.body.content);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('unauthorized') || result.message?.includes('permission') || result.message?.includes('own')) {
          res.status(403).json(result);
        } else if (result.message?.includes('validation') || result.message?.includes('required') || result.message?.includes('invalid')) {
          res.status(400).json(result);
        } else {
          res.status(500).json(result);
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete comment (soft delete)
  static async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CommentService.deleteComment(req.params.id, req.user?.userId!);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('unauthorized') || result.message?.includes('permission') || result.message?.includes('own')) {
          res.status(403).json(result);
        } else {
          res.status(500).json(result);
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get comments by user
  static async getCommentsByUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await CommentService.getCommentsByUser(userId, page, limit);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('invalid') || result.message?.includes('format')) {
          res.status(400).json(result);
        } else {
          res.status(500).json(result);
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
