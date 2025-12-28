import models from '../utils/db.js';
import { Op } from 'sequelize';

export const MessageService = {

  // Get chat history between two specific users
  async getConversation(currentUserId, otherUserId) {
    return await models.messages.findAll({
      where: {
        [Op.or]: [
          { sender_id: currentUserId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: currentUserId }
        ]
      },
      order: [['created_at', 'ASC']], // Oldest to newest (like Messenger/WhatsApp)
      include: [
        {
          model: models.users,
          as: 'sender',
          attributes: ['user_id', 'full_name']
        }
      ]
    });
  },

  // Get a list of users who have messaged the current user (Inbox overview)
  // This is a bit complex in SQL/Sequelize, often simpler to fetch recent messages and filter in JS
  // or use a `DISTINCT` query. For simplicity, we'll skip the "Inbox List" for now and focus on "Chat Detail".

  async sendMessage(senderId, receiverId, content) {
    if (senderId == receiverId) {
      throw new Error('You cannot message yourself');
    }

    const receiver = await models.users.findByPk(receiverId);
    if (!receiver) throw new Error('Receiver not found');

    return await models.messages.create({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false
    });
  },

  async markAsRead(messageId, receiverId) {
    const message = await models.messages.findByPk(messageId);
    if (!message) throw new Error('Message not found');

    // Only the receiver can mark it as read
    if (message.receiver_id !== receiverId) {
      throw new Error('Unauthorized');
    }

    return await message.update({ is_read: true });
  },
  
  // Utility: Get unread count for navbar badge
  async getUnreadCount(userId) {
    return await models.messages.count({
      where: {
        receiver_id: userId,
        is_read: false
      }
    });
  }
};