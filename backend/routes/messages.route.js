import { Router } from 'express';
import messageController from '../controllers/message.controller.js';
import authController from '../controllers/auth.controller.js';

const messageRouter = Router();

messageRouter.get('/unread-count', authController.checkAuth, messageController.getUnreadCount); 
messageRouter.get('/conversation/:userId', authController.checkAuth,  messageController.getConversation);
messageRouter.post('/', authController.checkAuth,  messageController.postOne);
messageRouter.put('/:id/read', authController.checkAuth,  messageController.markRead);

export default messageRouter;