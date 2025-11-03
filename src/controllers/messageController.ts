import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MessageService } from '../services/messageService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class MessageController {
  // Send a message
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await MessageService.sendMessage(req.user?.userId!, req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  }

  // Get conversation between two users
  static async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { recipientId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await MessageService.getConversation(req.user?.userId!, recipientId, page, limit);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  }

  // Get all conversations for a user
  static async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await MessageService.getConversations(req.user?.userId!, page, limit);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  }

  // Mark messages as read
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await MessageService.markAsRead(req.params.senderId, req.user?.userId!);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  }

  // Delete a message
  static async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await MessageService.deleteMessage(req.params.id, req.user?.userId!);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  }

  // Get message by ID
  static async getMessageById(req: Request, res: Response): Promise<void> {
    const result = await MessageService.getMessageById(req.params.id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  }

  // Get unread message count
  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await MessageService.getUnreadCount(req.user?.userId!);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  }
}
