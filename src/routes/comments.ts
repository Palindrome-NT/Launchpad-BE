import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest, validateParams } from '../middlewares/validation';
import { createCommentSchema, idSchema } from '../middlewares/validation';

export interface CommentDependencies {
  commentController: {
    createComment: (req: any, res: any) => Promise<void>;
    getCommentsByPost: (req: any, res: any) => Promise<void>;
    getCommentById: (req: any, res: any) => Promise<void>;
    updateComment: (req: any, res: any) => Promise<void>;
    deleteComment: (req: any, res: any) => Promise<void>;
    getCommentsByUser: (req: any, res: any) => Promise<void>;
  };
}

export const createCommentRoutes = (dependencies: CommentDependencies) => {
  const router = Router();
  router.get('/post/:postId', dependencies.commentController.getCommentsByPost);
  router.get('/user/:userId', dependencies.commentController.getCommentsByUser);
  router.get('/:id', validateParams(idSchema), dependencies.commentController.getCommentById);
  router.use(authenticateToken);
  router.post('/', validateRequest(createCommentSchema), dependencies.commentController.createComment);
  router.put('/:id', validateParams(idSchema), dependencies.commentController.updateComment);
  router.delete('/:id', validateParams(idSchema), dependencies.commentController.deleteComment);

  return router;
};

import { CommentController } from '../controllers/commentController';
export default createCommentRoutes({ commentController: CommentController });
