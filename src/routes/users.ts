import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middlewares/auth';

export interface UserDependencies {
  userController: {
    getProfile: (req: any, res: any) => Promise<void>;
    getAllUsers: (req: any, res: any) => Promise<void>;
    getUserById: (req: any, res: any) => Promise<void>;
    updateProfile: (req: any, res: any) => Promise<void>;
    deleteUser: (req: any, res: any) => Promise<void>;
  };
}

export const createUserRoutes = (dependencies: UserDependencies) => {
  const router = Router();

  router.use(authenticateToken);

  router.get('/profile', dependencies.userController.getProfile);

  router.get('/', requireRole(['admin', 'superadmin']), dependencies.userController.getAllUsers);

  router.get('/chat-user', dependencies.userController.getAllUsers);

  router.get('/:id', dependencies.userController.getUserById);

  router.put('/profile', dependencies.userController.updateProfile);

  router.delete('/:id', requireRole(['admin', 'superadmin']), dependencies.userController.deleteUser);

  return router;
};

export default createUserRoutes({ userController: UserController });
