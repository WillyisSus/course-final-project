import { Router } from 'express';
import messageController from '../controllers/message.controller.js';
import authController from '../controllers/auth.controller.js';
const messageRouter = Router();
messageRouter.use((req, res, next) => {
  authController.checkAuth(req, res, next);
});

messageRouter.get('/unread-count', messageController.getUnreadCount); 
messageRouter.get('/conversation',  messageController.getConversation);
messageRouter.post('/', messageController.postOne);
messageRouter.put('/:id/read', messageController.markRead);

export default messageRouter;