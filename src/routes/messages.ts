import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest, validateParams } from '../middlewares/validation';
import { sendMessageSchema } from '../middlewares/validation';
import { idSchema } from '../middlewares/validation';

const router = Router();

router.get('/unread-count', authenticateToken, MessageController.getUnreadCount);
router.get('/:id', validateParams(idSchema), MessageController.getMessageById);
router.use(authenticateToken);
router.get('/conversations', MessageController.getConversations);
router.get('/conversation/:recipientId', MessageController.getConversation);
router.post('/', validateRequest(sendMessageSchema), MessageController.sendMessage);
router.put('/mark-read/:senderId', MessageController.markAsRead);
router.delete('/:id', validateParams(idSchema), MessageController.deleteMessage);

export default router;
