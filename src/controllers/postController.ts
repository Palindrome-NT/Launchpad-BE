import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PostService } from '../services/postService';
import { AuthenticatedRequest } from '../middlewares/auth';
import { emitNewPost } from '../utils/socketBus';

export class PostController {
  // Create a new post
  static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await PostService.createPost(req.user?.userId!, req.body);

      if (result.success) {
        try {
          const created = (result as any).data?.post || (result as any).data || {};
          if (created && created._id) {
            emitNewPost({ postId: created._id.toString(), authorId: req.user?.userId!, content: created.content });
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

  // Get all posts with pagination
  static async getAllPosts(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        author: req.query.author as string,
      };

      const result = await PostService.getAllPosts(options);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('validation') || result.message?.includes('invalid')) {
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

  // Get post by ID
  static async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const result = await PostService.getPostById(req.params.id);

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

  // Update post
  static async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await PostService.updatePost(req.params.id, req.user?.userId!, req.body);

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

  // Delete post (soft delete)
  static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await PostService.deletePost(req.params.id, req.user?.userId!);

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

  // Get posts by user
  static async getUserPosts(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await PostService.getUserPosts(userId, page, limit);

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

  // Like/Unlike post
  static async toggleLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await PostService.toggleLike(req.params.id);

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

  // Upload media files
  static async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      // Check if files were uploaded
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
        return;
      }

      const files = Array.isArray(req.files) ? req.files : [req.files];
      const uploadedFiles: { url: string; type: string; filename: string }[] = [];

      // Process each uploaded file
      for (const file of files) {
        // Type guard to ensure file is a single file, not an array
        if (Array.isArray(file)) {
          continue; // Skip if it's an array (shouldn't happen with our multer config)
        }

        // Cast to Express.Multer.File to access properties
        const multerFile = file as Express.Multer.File;

        // Determine file type
        const isImage = multerFile.mimetype.startsWith('image/');
        const isVideo = multerFile.mimetype.startsWith('video/');
        
        if (!isImage && !isVideo) {
          res.status(400).json({
            success: false,
            message: 'Only images and videos are allowed'
          });
          return;
        }

        // Generate URL for the uploaded file
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const filePath = multerFile.path.replace(/\\/g, '/'); // Replace backslashes with forward slashes
        const url = `${baseUrl}/${filePath}`;

        uploadedFiles.push({
          url: url,
          type: isImage ? 'image' : 'video',
          filename: multerFile.filename
        });
      }

      // Validate media constraints
      const videoCount = uploadedFiles.filter(f => f.type === 'video').length;
      const imageCount = uploadedFiles.filter(f => f.type === 'image').length;

      if (videoCount > 1) {
        res.status(400).json({
          success: false,
          message: 'Maximum 1 video allowed per upload'
        });
        return;
      }

      if (imageCount > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 images allowed per upload'
        });
        return;
      }

      // Return success response with uploaded file URLs
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          files: uploadedFiles,
          urls: uploadedFiles.map(f => f.url),
          types: uploadedFiles.map(f => f.type)
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during file upload'
      });
    }
  }
}
