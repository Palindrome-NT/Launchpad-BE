import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class UserController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserService.createUser(req.body);

      if (result.success) {
        res.status(201).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('already exists') || result.message?.includes('duplicate')) {
          res.status(409).json(result);
        } else if (result.message?.includes('validation') || result.message?.includes('required')) {
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

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserService.loginUser(req.body);

      if (result.success && result.data) {
        const { accessToken, refreshToken } = result.data;

        // res.cookie('accessToken', accessToken, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production',
        //   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        //   path: '/',
        //   maxAge: 15 * 60 * 1000,
        // });

        // res.cookie('refreshToken', refreshToken, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production',
        //   sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        //   path: '/',
        //   maxAge: 7 * 24 * 60 * 60 * 1000,
        // });

        res.setHeader("Set-Cookie", [
          `accessToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${15 * 60}`,
          `refreshToken=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${7 * 24 * 60 * 60}`
        ]);

        const { accessToken: _, refreshToken: __, ...responseData } = result.data;

        res.status(200).json({
          ...result,
          data: responseData,
          accessToken,
          refreshToken
        });
      }  else {
        res.status(401).json({
          success: false,
          message: result.message || 'Login failed',
        });
      }
    } catch (error){
        res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserService.verifyOtp(req.body);

      if (result.success && result.data) {
        const { accessToken, refreshToken } = result.data;

        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const { accessToken: _, refreshToken: __, ...responseData } = result.data;

        res.status(200).json({
          ...result,
          data: responseData,
        });
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('invalid') || result.message?.includes('expired') || result.message?.includes('incorrect')) {
          res.status(400).json(result);
        } else if (result.message?.includes('validation') || result.message?.includes('required')) {
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

  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserService.resendOtp(req.body.email);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('validation') || result.message?.includes('required')) {
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

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserService.refreshToken(req.body.refreshToken);

      if (result.success && result.data) {
        const { accessToken, refreshToken } = result.data;

        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const { accessToken: _, refreshToken: __, ...responseData } = result.data;

        res.status(200).json({
          ...result,
          data: responseData,
        });
      } else {
        // Handle different types of errors
        if (result.message?.includes('invalid') || result.message?.includes('expired') || result.message?.includes('malformed')) {
          res.status(401).json(result);
        } else if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('validation') || result.message?.includes('required')) {
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

  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await UserService.getUserProfile(req.user?.userId!);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
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

  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UserService.getAllUsers(page, limit);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('unauthorized') || result.message?.includes('permission')) {
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

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await UserService.getUserById(req.params.id);

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

  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await UserService.updateUserProfile(req.user?.userId!, req.body);

      if (result.success) {
        res.status(200).json(result);
      } else {
        // Handle different types of errors
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
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

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userIdToDelete = req.params.id;
      
      if (!userIdToDelete) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const requesterUserId = req.user?.userId!;
      const requesterRole = req.user?.role!;

      const result = await UserService.deleteUser(userIdToDelete, requesterUserId, requesterRole);

      if (result.success) {
        res.status(200).json(result);
      } else {
        if (result.message?.includes('not found') || result.message?.includes('does not exist')) {
          res.status(404).json(result);
        } else if (result.message?.includes('cannot delete') || result.message?.includes('cannot delete your own') || result.message?.includes('Insufficient permissions')) {
          res.status(403).json(result);
        } else if (result.message?.includes('unauthorized') || result.message?.includes('permission')) {
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
}
