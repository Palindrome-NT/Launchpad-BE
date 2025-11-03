import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { PaginationResult, MessageCreationData, ServiceResponse } from './types';

export class MessageService {
  /**
   * Send a message
   */
  static async sendMessage(senderId: string, messageData: MessageCreationData): Promise<ServiceResponse<any>> {
    try {
      const { recipientId, content } = messageData;

      // Validate content
      if (!content?.trim()) {
        return {
          success: false,
          message: 'Message content is required',
        };
      }

      if (content.length > 1000) {
        return {
          success: false,
          message: 'Message content cannot exceed 1000 characters',
        };
      }

      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return {
          success: false,
          message: 'Invalid recipient ID format',
        };
      }

      // Check if recipient exists and is active
      const recipient = await User.findOne({
        _id: recipientId,
        isDeleted: false,
        isActive: true,
        isVerified: true,
      });

      if (!recipient) {
        return {
          success: false,
          message: 'Recipient not found or inactive',
        };
      }

      // Prevent sending message to self
      if (recipientId === senderId) {
        return {
          success: false,
          message: 'Cannot send message to yourself',
        };
      }

      // Create message
      const message = new Message({
        senderId,
        recipientId,
        content: content.trim(),
      });

      await message.save();

      // Populate sender and recipient information
      await message.populate('senderId', 'name email mobile');
      await message.populate('recipientId', 'name email mobile');

      return {
        success: true,
        message: 'Message sent successfully',
        data: message,
      };
    } catch (error: any) {
      console.error('Send message error:', error);
      return {
        success: false,
        message: 'Failed to send message',
        error: error.message,
      };
    }
  }

  /**
   * Get conversation between two users
   */
  static async getConversation(senderId: string, recipientId: string, page: number = 1, limit: number = 50): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return {
          success: false,
          message: 'Invalid recipient ID format',
        };
      }

      // Verify recipient exists
      const recipient = await User.findOne({
        _id: recipientId,
        isDeleted: false,
      });

      if (!recipient) {
        return {
          success: false,
          message: 'Recipient not found',
        };
      }

      const skip = (page - 1) * limit;

      const messages = await Message.find({
        $or: [
          { senderId, recipientId, isDeleted: false },
          { senderId: recipientId, recipientId: senderId, isDeleted: false },
        ],
      })
        .populate('senderId', 'name email mobile')
        .populate('recipientId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Message.countDocuments({
        $or: [
          { senderId, recipientId, isDeleted: false },
          { senderId: recipientId, recipientId: senderId, isDeleted: false },
        ],
      });

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      return {
        success: true,
        message: 'Conversation fetched successfully',
        data: {
          items: messages,
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
      console.error('Get conversation error:', error);
      return {
        success: false,
        message: 'Failed to fetch conversation',
        error: error.message,
      };
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: string, page: number = 1, limit: number = 20): Promise<ServiceResponse<PaginationResult<any>>> {
    try {
      const skip = (page - 1) * limit;

      // Find all unique users the current user has messaged with
      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { recipientId: new mongoose.Types.ObjectId(userId) },
            ],
            isDeleted: false,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
                '$recipientId',
                '$senderId',
              ],
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipientId', new mongoose.Types.ObjectId(userId)] },
                      { $eq: ['$isRead', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $match: {
            'user.isDeleted': false,
          },
        },
        {
          $project: {
            _id: 1,
            user: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              mobile: '$user.mobile',
            },
            lastMessage: 1,
            unreadCount: 1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const total = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { recipientId: new mongoose.Types.ObjectId(userId) },
            ],
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
                '$recipientId',
                '$senderId',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $match: {
            'user.isDeleted': false,
          },
        },
        {
          $count: 'total',
        },
      ]);

      return {
        success: true,
        message: 'Conversations fetched successfully',
        data: {
          items: conversations,
          pagination: {
            total: total[0]?.total || 0,
            page,
            limit,
            totalPages: Math.ceil((total[0]?.total || 0) / limit),
            hasNext: page < Math.ceil((total[0]?.total || 0) / limit),
            hasPrev: page > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Get conversations error:', error);
      return {
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message,
      };
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(senderId: string, recipientId: string): Promise<ServiceResponse<{ modifiedCount: number }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        return {
          success: false,
          message: 'Invalid sender ID format',
        };
      }

      const result = await Message.updateMany(
        {
          senderId,
          recipientId,
          isRead: false,
          isDeleted: false,
        },
        { isRead: true }
      );

      return {
        success: true,
        message: 'Messages marked as read',
        data: {
          modifiedCount: result.modifiedCount,
        },
      };
    } catch (error: any) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message,
      };
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return {
          success: false,
          message: 'Invalid message ID format',
        };
      }

      const message = await Message.findOne({
        _id: messageId,
        $or: [
          { senderId: userId },
          { recipientId: userId },
        ],
        isDeleted: false,
      });

      if (!message) {
        return {
          success: false,
          message: 'Message not found or unauthorized',
        };
      }

      message.isDeleted = true;
      await message.save();

      return {
        success: true,
        message: 'Message deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete message error:', error);
      return {
        success: false,
        message: 'Failed to delete message',
        error: error.message,
      };
    }
  }

  /**
   * Get message by ID
   */
  static async getMessageById(messageId: string): Promise<ServiceResponse<any>> {
    try {
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return {
          success: false,
          message: 'Invalid message ID format',
        };
      }

      const message = await Message.findOne({
        _id: messageId,
        isDeleted: false,
      })
        .populate('senderId', 'name email mobile')
        .populate('recipientId', 'name email mobile');

      if (!message) {
        return {
          success: false,
          message: 'Message not found',
        };
      }

      return {
        success: true,
        message: 'Message fetched successfully',
        data: message,
      };
    } catch (error: any) {
      console.error('Get message by ID error:', error);
      return {
        success: false,
        message: 'Failed to fetch message',
        error: error.message,
      };
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<ServiceResponse<{ unreadCount: number }>> {
    try {
      const count = await Message.countDocuments({
        recipientId: userId,
        isRead: false,
        isDeleted: false,
      });

      return {
        success: true,
        message: 'Unread count fetched successfully',
        data: {
          unreadCount: count,
        },
      };
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        message: 'Failed to get unread count',
        error: error.message,
      };
    }
  }
}
