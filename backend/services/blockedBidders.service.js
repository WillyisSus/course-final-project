import { Op } from 'sequelize';
import models, { sequelize } from '../utils/db.js'; //

export const BlockBidderService = {

  // Fetch all users blocked from a specific product
  async findAllBlocks(){
    return await models.blocked_bidders.findAll();
  },
  async findAllBlockedByProduct(productId, sellerId = null) {
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
  async findAllBlockedBySeller(sellerId) {
    return await models.blocked_bidders.findAll({
      include: [
        {
          model: models.products,
          as: 'product',
          where: { seller_id: sellerId },
          attributes: ['product_id', 'name']
        },
        {
          model: models.users,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email']
        }
      ]
    });
  },
  async getAllBlockedByUser(userId) {
    return await models.blocked_bidders.findAll({
      where: { user_id: userId }, 
      include: [
        {
          model: models.products,
          as: 'product',
          attributes: ['product_id', 'name', 'seller_id'],
          include: [
            {
              model: models.users,
              as: 'seller',
              attributes: ['user_id', 'full_name', 'email']
            }
          ]
        }
      ]
    });
  },
  async findBlockEntry(productId, userId) {
    return await models.blocked_bidders.findOne({
      where: { product_id: productId, user_id: userId }
    });
  },
  // Block a user (Create)
  async createBlock(productId, sellerId, userIdToBlock, reason) {
    // 1. Verify ownership: Only the seller can block people from their product
    return await sequelize.transaction(async (t) => {
      const product = await models.products.findByPk(productId , {transaction: t});
      
      if (!product) throw new Error('Product not found');
      
      if (product.seller_id !== sellerId) {
        throw new Error('Unauthorized: You can only block bidders on your own products');
      }

      // 2. Prevent blocking yourself
      if (userIdToBlock === sellerId) {
        throw new Error('You cannot block yourself');
      }
      const existingBlock = await models.blocked_bidders.findOne({
        where: {
          product_id: productId,
          user_id: userIdToBlock
        },
        transaction: t
      });
      if (existingBlock) {
        throw new Error('User is already blocked from this product');
      }
      // 3. Create the block entry
      const newBlock = await models.blocked_bidders.create({
        product_id: productId,
        user_id: userIdToBlock,
        reason: reason || 'Blocked by seller',
        blocked_at: new Date()
      }, {transaction: t});
      if (userIdToBlock === product.winner_id) {
        // If the blocked user was the winner, remove them as winner
        const highestNonWinnerBid = await models.bids.findOne({
          where: {
            product_id: productId,
            bidder_id : { [Op.ne]: userIdToBlock }
          },
          order: [['amount', 'DESC']],
          transaction: t
        });
        if (highestNonWinnerBid) {
          await models.products.update(
            { winner_id: highestNonWinnerBid.bidder_id, price_current: highestNonWinnerBid.amount},
            { where: { product_id: productId }, transaction: t }
          );
        }else{
          await models.products.update(
            { winner_id: null, price_current: null},
            { where: { product_id: productId }, transaction: t }
          );
        }
      }
      // Clean up auto-bids from the blocked user for this product
      await models.bids.destroy({
        where: {
          product_id: productId,
          bidder_id: userIdToBlock
        },
        transaction: t
      });
      await models.auto_bids.destroy({
        where: {
          product_id: productId,
          bidder_id: userIdToBlock
        },
        transaction: t
      });
      return newBlock;
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