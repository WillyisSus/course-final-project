import { MessageService } from '../services/messages.service.js';

const messageController = {
    // GET /api/messages?user_id=XXX&product_id=YYY
    // Get chat history with a specific user (e.g., Seller ID)
    getConversation: async (req, res) => {
        try {
            const currentUserId = req.user.user_id;
            const {user_id, product_id} = req.query;
            if (!user_id || !product_id) {
                return res.status(400).json({ message: "user_id and product_id query parameters are required" });
            }
            const conversation = await MessageService.getConversation(currentUserId, user_id, product_id);
            res.json({ 
                message: "Conversation retrieved", 
                data: conversation 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // POST /api/messages
    // Send a message
    postOne: async (req, res) => {
        try {
            const senderId = req.user.user_id;
            const { receiver_id, product_id, content } = req.body;

            if (!receiver_id || !content || !product_id) {
                return res.status(400).json({ message: "Receiver ID and Content are required" });
            }
            const newMessage = await MessageService.sendMessage(senderId, receiver_id, product_id, content);
            const io = req.app.get('io');
            if (io) {
                io.to(`transaction_${product_id}`).emit('new_transaction_message', newMessage);
            }
            res.status(201).json({ 
                message: "Message sent", 
                data: newMessage 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // PUT /api/messages/:id/read
    // Mark a message as read
    markRead: async (req, res) => {
        try {
            const receiverId = req.user.user_id;
            const messageId = req.params.id;

            await MessageService.markAsRead(messageId, receiverId);

            res.json({ message: "Message marked as read" });
        } catch (error) {
            const status = error.message.includes('Unauthorized') ? 403 : 500;
            res.status(status).json({ message: error.message });
        }
    },

    // GET /api/messages/unread-count
    // Useful for the notification badge in your Navbar
    getUnreadCount: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const count = await MessageService.getUnreadCount(userId);
            
            res.json({ 
                message: "Unread count retrieved", 
                data: { count } 
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default messageController;