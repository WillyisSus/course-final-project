import models from '../utils/db.js'; //

export const FeedbackService = {

  // Get all reviews for a specific user (to build their profile)
  async findAllFeedbacksByUser(userId) {
    return await models.feedbacks.findAll({
      where: { to_user_id: userId }, //
      include: [
        {
          model: models.users,
          as: 'from_user', //
          attributes: ['full_name', 'user_id']
        },
        {
          model: models.products,
          as: 'product', //
          attributes: ['name', 'product_id']
        }
      ],
      order: [['feedback_id', 'DESC']]
    });
  },

  async createFeedback(feedbackData) {
    const { product_id, from_user_id, to_user_id, rating, comment } = feedbackData;

    // Validation: Ensure the transaction actually happened
    const product = await models.products.findByPk(product_id);
    if (!product) throw new Error('Product not found');
    
    // Check if the 'from_user' was actually the winner or seller
    const isWinner = product.winner_id === from_user_id;
    const isSeller = product.seller_id === from_user_id;

    if (!isWinner && !isSeller) {
      throw new Error('You cannot leave feedback for a product you were not involved with.');
    }
    const newFeedback = await models.feedbacks.create({
      product_id,
      from_user_id,
      to_user_id,
      rating,
      comment
    });
    const toUser = await models.users.findByPk(to_user_id);
    if (toUser) {
      // Update the user's average rating
      if (rating < 0){
        toUser.negative_rating += 1;
      } else {
        toUser.positive_rating += 1;
      }
      await toUser.save();
    }
    return newFeedback;

  },

  // Usually users can't update feedback, but Admins might need to censor it
  async updateFeedback(feedbackId, updateData) {
    const feedback = await models.feedbacks.findByPk(feedbackId);
    if (!feedback) throw new Error('Feedback not found');
    return await feedback.update(updateData);
  },

  async deleteFeedback(feedbackId) {
    const feedback = await models.feedbacks.findByPk(feedbackId);
    if (!feedback) throw new Error('Feedback not found');
    return await feedback.destroy();
  }
};