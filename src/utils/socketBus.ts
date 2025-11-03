import { Server } from 'socket.io';

let ioRef: Server | null = null;

export const setSocketIO = (io: Server) => {
  ioRef = io;
};

export const getSocketIO = (): Server | null => ioRef;

export const emitNewPost = (data: { postId: string; authorId: string; content?: string }) => {
  ioRef?.emit('post_created', data);
};

export const emitNewComment = (data: { commentId: string; postId: string; authorId: string; content?: string }) => {
  ioRef?.emit('comment_created', data);
};
