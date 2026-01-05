import models, { sequelize } from '../utils/db.js'; //
import { Op } from 'sequelize';

export const BidService = {

  // The core function: placing a new bid
  async createBid(bidData) {
    const { product_id, bidder_id, amount } = bidData;

    // 1. Validation: Ensure product exists and is active
    const product = await models.products.findByPk(product_id);
    if (!product) throw new Error('Product not found');
    if (product.status !== 'ACTIVE') throw new Error('Bidding is closed for this product'); //
    if (new Date() > product.end_date) throw new Error('Auction has ended');

    // 2. Validation: Prevent self-bidding
    if (product.seller_id === bidder_id) throw new Error('Sellers cannot bid on their own products');

    // 3. Validation: Check if user is blocked
    const blocked = await models.blocked_bidders.findOne({
      where: { product_id, user_id: bidder_id } //
    });
    if (blocked) throw new Error('You are blocked from bidding on this product');

    // 4. Validation: Price Rules
    const currentPrice = parseFloat(product.price_current);
    const step = parseFloat(product.price_step);
    
    // If no bids yet, bid must be >= start_price. Otherwise, >= current_price + step
    // const bidCount = await models.bids.count({ where: { product_id } });
    
    // Logic: First bid must meet start price; subsequent bids must exceed current + step
    // if (bidCount === 0) {
        if (amount < currentPrice) throw new Error(`Bid must be greater than current price: ${currentPrice}`);
    // } else {
    //     if (amount < currentPrice + step) throw new Error(`Bid must be at least ${currentPrice + step}`);
    // }

    // 5. Transaction: Execute the bid safely
    // I am using a managed transaction to ensure all updates happen or none do
    return await sequelize.transaction(async (t) => {
      
      // A. Create the new bid log
      const newBid = await models.bids.create({
        product_id,
        bidder_id,
        amount,
        status: 'VALID',
        time: new Date()
      }, { transaction: t });

      // B. Prepare product updates
      const updateData = {
        price_current: amount,
        winner_id: bidder_id
      };

      // C. Anti-Sniping Logic: Extend auction if bid is near the end
      // e.g., if within last 5 minutes, extend by 10 minutes
      if (product.is_auto_extend) { //
        const now = new Date();
        const timeRemaining = new Date(product.end_date) - now;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeRemaining < fiveMinutes && timeRemaining > 0) {
          const tenMinutes = 10 * 60 * 1000;
          updateData.end_date = new Date(new Date(product.end_date).getTime() + tenMinutes);
        }
      }

      await product.update(updateData, { transaction: t });

      // Note: This is where you would trigger the Auto-Bid (Proxy) check logic
      // to see if this new bid triggers someone else's max_price limit.

      return newBid;
    });
  },

  // listing the history of bids for the product page
  async findAllBidsOfProduct(productId) {
    return await models.bids.findAll({
      where: { 
        product_id: productId,
        status: 'VALID' // only showing valid bids
      },
      include: [
        {
          model: models.users,
          as: 'bidder', //
          attributes: ['user_id', 'full_name', 'positive_rating', 'negative_rating'] // masking email/private info
        }
      ],
      order: [['amount', 'DESC']] // highest bid first
    });
  },
  async findHighestBidOfProduct(productId) {
    return await models.bids.findOne({
      where: {
        product_id: productId,
        status: 'VALID'
      },
      order: [['amount', 'DESC']]
    });
  },
  async findBidDetail(bidId, bidderId=null) {
    const bid =  await models.bids.findByPk(bidId, {
      include: [
        {
          model: models.users,
          as: 'bidder',
          attributes: ['user_id', 'full_name', 'positive_rating', 'negative_rating']
        },
      ]
    });
    if (!bid) throw new Error('Bid not found');
    return bid;
  },
  // Admin-only or special logic: fixing a bid
  async updateBid(bidId, updateData) {
    const bid = await models.bids.findByPk(bidId);
    if (!bid) throw new Error('Bid not found');

    // Usually used to change status to 'REJECTED' rather than changing amounts
    return await bid.update(updateData);
  },

  // Admin-only: removing a bid (e.g. fraudulent)
  async deleteBid(bidId) {
    const bid = await models.bids.findByPk(bidId);
    if (!bid) throw new Error('Bid not found');

    // Warning: Deleting the highest bid requires recalculating the product's price
    // This simple delete assumes the caller handles that logic or it's not the high bid.
    return await bid.destroy();
  }
};