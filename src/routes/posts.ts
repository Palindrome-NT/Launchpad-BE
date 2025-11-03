import { Router } from 'express';
import { PostController } from '../controllers/postController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest, validateParams } from '../middlewares/validation';
import { createPostSchema, updatePostSchema } from '../middlewares/validation';
import { idSchema } from '../middlewares/validation';
import { uploadMultiple } from '../middlewares/upload';

export interface PostDependencies {
  postController: {
    getAllPosts: (req: any, res: any) => Promise<void>;
    getPostById: (req: any, res: any) => Promise<void>;
    getUserPosts: (req: any, res: any) => Promise<void>;
    createPost: (req: any, res: any) => Promise<void>;
    updatePost: (req: any, res: any) => Promise<void>;
    deletePost: (req: any, res: any) => Promise<void>;
    toggleLike: (req: any, res: any) => Promise<void>;
    uploadMedia: (req: any, res: any) => Promise<void>;
  };
}

export const createPostRoutes = (dependencies: PostDependencies) => {
  const router = Router();
  router.get('/', dependencies.postController.getAllPosts);
  router.get('/:id', validateParams(idSchema), dependencies.postController.getPostById);
  router.get('/user/:userId', dependencies.postController.getUserPosts);
  router.use(authenticateToken);
  router.post('/', validateRequest(createPostSchema), dependencies.postController.createPost);
  router.put('/:id', validateParams(idSchema), validateRequest(updatePostSchema), dependencies.postController.updatePost);
  router.delete('/:id', validateParams(idSchema), dependencies.postController.deletePost);
  router.post('/:id/like', validateParams(idSchema), dependencies.postController.toggleLike);
  router.post('/upload', uploadMultiple, dependencies.postController.uploadMedia);

  return router;
};

export default createPostRoutes({ postController: PostController });
