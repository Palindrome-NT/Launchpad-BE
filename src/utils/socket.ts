import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userEmail?: string;
    userName?: string;
  }
}

const onlineUsers = new Map<string, { socketId: string; userId: string; userName: string; userEmail: string }>();

export const initializeSocket = (io: SocketIOServer) => {

  io.use(async (socket, next) => {
    console.log('🔐 Socket middleware - authenticating connection');
    try {
      const cookies = socket.handshake.headers.cookie;

      if (!cookies) {
        console.log('❌ No cookies provided');
        return next(new Error('Authentication error: No cookies provided'));
      }

      const cookieArray = cookies.split(';').map(c => c.trim());
      const accessTokenCookie = cookieArray.find(c => c.startsWith('accessToken='));
      
      if (!accessTokenCookie) {
        console.log('❌ No accessToken cookie found');
        console.log('Available cookies:', cookieArray.map(c => c.split('=')[0]));
        return next(new Error('Authentication error: No access token in cookies'));
      }

      const token = accessTokenCookie.split('=')[1];
      console.log('🔑 Access token extracted from cookie');

      console.log('🔓 Verifying token...');
      const decoded = verifyAccessToken(token as string);
      if (!decoded) {
        console.log('❌ Token verification failed');
        return next(new Error('Authentication error: Invalid token'));
      }

      console.log('✅ Token verified for user:', decoded.userId);

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || user.isDeleted) {
        console.log('❌ User not found or inactive:', decoded.userId);
        return next(new Error('User not found or inactive'));
      }

      console.log('✅ User found:', user.email);

      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userName = user.name || user.email;
      console.log("✅ Socket authenticated:", socket.userName)
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      next(new Error('Authentication error: ' + (error as Error).message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userEmail}) - Socket ID: ${socket.id}`);

    // Add user to online users
    if (socket.userId) {
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName || socket.userEmail || 'Unknown',
        userEmail: socket.userEmail || '',
      });

      console.log(`👤 Added to online users. Total online: ${onlineUsers.size}`);

      socket.join(`user_${socket.userId}`);
      console.log(`🏠 User joined personal room: user_${socket.userId}`);

      io.emit('user_online', {
        userId: socket.userId,
        userName: socket.userName,
        userEmail: socket.userEmail,
      });
      console.log('📢 Broadcasted user_online event');

      const onlineUsersList = Array.from(onlineUsers.values()).map(u => ({
        userId: u.userId,
        userName: u.userName,
        userEmail: u.userEmail,
      }));
      socket.emit('online_users', onlineUsersList);
      console.log(`📋 Sent online users list (${onlineUsersList.length} users)`);
    }

    socket.on('join_conversation', (otherUserId: string) => {
      const roomId = [socket.userId, otherUserId].sort().join('_');
      socket.join(roomId);
      console.log(`📱 User ${socket.userId} joined conversation ${roomId}`);
    });

    socket.on('leave_conversation', (otherUserId: string) => {
      const roomId = [socket.userId, otherUserId].sort().join('_');
      socket.leave(roomId);
      console.log(`📱 User ${socket.userId} left conversation ${roomId}`);
    });

    // Real-time message sending (no DB storage)
    socket.on('send_message', async (data: {
      recipientId: string;
      content: string;
      tempId?: string;
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const { recipientId, content, tempId } = data;

        // Get sender info
        const sender = await User.findById(socket.userId).select('name email picture');
        if (!sender) {
          socket.emit('error', { message: 'Sender not found' });
          return;
        }

        // Get recipient info
        const recipient = await User.findById(recipientId).select('name email picture');
        if (!recipient) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        const roomId = [socket.userId, recipientId].sort().join('_');

        const message = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tempId,
          senderId: {
            _id: sender._id.toString(),
            name: sender.name,
            email: sender.email,
            picture: sender.picture,
          },
          recipientId: {
            _id: recipient._id.toString(),
            name: recipient.name,
            email: recipient.email,
            picture: recipient.picture,
          },
          content,
          createdAt: new Date().toISOString(),
        };

        // Send to both users in the conversation room
        io.to(roomId).emit('receive_message', message);

        // Send notification to recipient if they're not in the conversation
        socket.to(`user_${recipientId}`).emit('new_message_notification', {
          messageId: message.id,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        });

        console.log(`📤 Real-time message sent from ${socket.userId} to ${recipientId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', (data: { recipientId: string }) => {
      socket.to(`user_${data.recipientId}`).emit('user_typing_start', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('typing_stop', (data: { recipientId: string }) => {
      socket.to(`user_${data.recipientId}`).emit('user_typing_stop', {
        userId: socket.userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId} (${socket.userEmail})`);

      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        io.emit('user_offline', {
          userId: socket.userId,
        });
      }
    });
  });
};
