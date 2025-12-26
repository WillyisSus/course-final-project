import models from '../utils/db.js'; //

export const BlockBidderService = {

  // Fetch all users blocked from a specific product
  async findAllBlockedByProduct(productId) {
    return await models.blocked_bidders.findAll({
      where: { product_id: productId }, //
      include: [
        {
          model: models.users,
          as: 'user', //
          attributes: ['user_id', 'full_name', 'email']
        }
      ]
    });
  },

  // Block a user (Create)
  async createBlock(productId, sellerId, userIdToBlock, reason) {
    // 1. Verify ownership: Only the seller can block people from their product
    const product = await models.products.findByPk(productId);
    if (!product) throw new Error('Product not found');
    
    if (product.seller_id !== sellerId) {
      throw new Error('Unauthorized: You can only block bidders on your own products');
    }

    // 2. Prevent blocking yourself
    if (userIdToBlock === sellerId) {
      throw new Error('You cannot block yourself');
    }

    // 3. Create the block entry
    return await models.blocked_bidders.create({
      product_id: productId,
      user_id: userIdToBlock,
      reason: reason || 'Blocked by seller',
      blocked_at: new Date()
    });
  },

  // Update the reason for a block
  async updateBlock(productId, sellerId, userIdBlocked, newReason) {
    // Verify ownership again
    const product = await models.products.findByPk(productId);
    if (!product || product.seller_id !== sellerId) {
      throw new Error('Unauthorized or Product not found');
    }

    const blockEntry = await models.blocked_bidders.findOne({
        where: { product_id: productId, user_id: userIdBlocked }
    });

    if (!blockEntry) throw new Error('Block entry not found');

    return await blockEntry.update({
      reason: newReason
    });
  },

  // Unblock a user (Delete)
  async deleteBlock(productId, sellerId, userIdBlocked) {
    // Verify ownership
    const product = await models.products.findByPk(productId);
    if (!product || product.seller_id !== sellerId) {
      throw new Error('Unauthorized or Product not found');
    }

    const blockEntry = await models.blocked_bidders.findOne({
      where: { product_id: productId, user_id: userIdBlocked }
    });

    if (!blockEntry) throw new Error('User is not blocked');

    return await blockEntry.destroy();
  }
};