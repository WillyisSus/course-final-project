import models from '../utils/db.js'; //
import { sequelize } from '../utils/db.js'; //
export const AutoBidService = {

  // Setting up a proxy bid for a user
  async createAutoBid(productId, bidderId, maxPrice) {
    // 1. Check if product exists and is active
    const product = await models.products.findByPk(productId);
    if (!product) throw new Error('Product not found');
    if (product.status !== 'ACTIVE') throw new Error('Cannot set auto-bid on closed auction'); //

    // 2. Validate ownership (Seller cannot auto-bid on own item)
    if (product.seller_id === bidderId) {
      throw new Error('Sellers cannot place auto-bids on their own products');
    }

    // 3. Validate price logic: Max price must be at least current price + price step
    const minRequired = parseFloat(product.price_current) + parseFloat(product.price_step); //
    
    if (parseFloat(maxPrice) < minRequired) {
      throw new Error(`Auto-bid max price must be at least ${minRequired} (Current Price + Step)`);
    }

    // 4. Check for existing auto-bid
    // Since we have a unique constraint on [product_id, bidder_id], checking first prevents a DB error
    const existingAutoBid = await models.auto_bids.findOne({
      where: { product_id: productId, bidder_id: bidderId }
    });

    if (existingAutoBid) {
      throw new Error('You already have an auto-bid for this product. Please update it instead.');
    }

    // 5. Create the record
    const newAutoBidRecord = await models.auto_bids.create({
      product_id: productId,
      bidder_id: bidderId,
      max_price: maxPrice
    });

    // Start calculating bids based on this new auto-bid

    return newAutoBidRecord;
  },
  async calculateAutoBids(productId, newBidderId, maxPrice){
    console.log("Calculating auto-bids for product:", productId, "by bidder:", newBidderId, "with max price:", maxPrice);
    return await sequelize.transaction(async (t) => {
      const product = await models.products.findByPk(productId, {
          transaction: t,
          lock: true
      });

      if (!product) throw new Error("Product not found");
      // Find current highest bid of product
      const highestBid = await models.bids.findOne({
          where: {
              product_id: productId,
              status: 'VALID'
          },
          order: [['amount', 'DESC']],
          transaction: t 
      });
  
      // Start calculating new bids
      // There is an existing bid, see if we need to outbid
      // 1. If the new maxPrice is higher than current highest, place a new bid
      //  1.1 If the new MaxPrice - current MaxPrice > step, outdid by a full step
      //  1.2 Else, outbid by just enough to match the new maxPrice
      // 2. If the new maxPrice is lower or equal, add a new the bid record to be the max_price of
      // the lower highest maxPrice auto-bidder, but the bid holder is still the current highest bidder. 
      if (highestBid) {
          // Find max price of old auto-bidder
          const oldMaxPriceAutoBid = await models.auto_bids.findOne({
              where: { product_id: productId, bidder_id: highestBid.bidder_id },
              transaction: t
          });

          if (oldMaxPriceAutoBid == null) {
              throw new Error('Old auto-bid not found, something bad happened');
          }
          if (parseFloat(maxPrice) > parseFloat(oldMaxPriceAutoBid.max_price)) {
              const newBidAmount = Math.min(
                  parseFloat(oldMaxPriceAutoBid.max_price) + parseFloat(product.price_step),
                  parseFloat(maxPrice)
              );
              console.log("Placing new bid of amount:", newBidAmount, " of bidder:", newBidderId);
              await models.bids.create({
                  product_id: productId,
                  bidder_id: newBidderId, 
                  amount: newBidAmount,
                  status: 'VALID',
                  time: new Date()
              }, { transaction: t }); 

              await product.update({
                  price_current: newBidAmount,
                  winner_id: newBidderId
              }, { transaction: t }); 

          } else {
  
              const newBidAmount = Math.min(
                  parseFloat(oldMaxPriceAutoBid.max_price),
                  parseFloat(maxPrice)
              );

              console.log("Placing new bid of amount:", newBidAmount, " of bidder:", oldMaxPriceAutoBid.bidder_id);
              await models.bids.create({
                  product_id: productId,
                  bidder_id: oldMaxPriceAutoBid.bidder_id, 
                  amount: newBidAmount,
                  status: 'VALID',
                  time: new Date()
              }, { transaction: t });

              await product.update({
                  price_current: newBidAmount
              }, { transaction: t });
          }
      } else {
          const firstBidAmount = product.price_start;

          await models.bids.create({
              product_id: productId,
              bidder_id: newBidderId,
              amount: firstBidAmount,
              status: 'VALID',
              time: new Date()
          }, { transaction: t });

          await product.update({
              price_current: firstBidAmount,
              winner_id: newBidderId
          }, { transaction: t });
      }
    });
  },
  async findAllAutoBidsOfProduct(productId) {
    return await models.auto_bids.findAll({
      where: { product_id: productId },
      include: [
        {
          model: models.users,
          as: 'bidder', //
          attributes: ['user_id', 'full_name', 'positive_rating'] // minimal user info
        }
      ],
      order: [['max_price', 'DESC']] // Highest max willingness at the top
    });
  },
  async findAutoBidOfUserForProduct(productId, bidderId) {
    return await models.auto_bids.findOne({
      where: { product_id: productId, bidder_id: bidderId }
    });
  },

  // Modifying the max price of an existing auto-bid
  async updateAutoBid(autoBidId, bidderId, newMaxPrice) {
    const autoBid = await models.auto_bids.findByPk(autoBidId);

    if (!autoBid) throw new Error('Auto-bid configuration not found');

    // Security check: Ensure the user owns this auto-bid
    if (autoBid.bidder_id !== bidderId) {
      throw new Error('Unauthorized: You can only update your own auto-bids');
    }

    // We also need to check the current product price again to ensure the new max is valid
    const product = await models.products.findByPk(autoBid.product_id);
    
    // Validate price logic: New max price must be at least current price + price step
    const minRequired = parseFloat(product.price_current) + parseFloat(product.price_step); //

    if (parseFloat(newMaxPrice) < minRequired) {
      throw new Error(`New max price must be at least ${minRequired} (Current Price + Step)`);
    }

    return await autoBid.update({
      max_price: newMaxPrice
    });
  },

  // Removing an auto-bid (turning off proxy bidding)
  async deleteAutoBid(autoBidId, bidderId) {
    const autoBid = await models.auto_bids.findByPk(autoBidId);

    if (!autoBid) throw new Error('Auto-bid configuration not found');

    // Security check
    if (autoBid.bidder_id !== bidderId) {
      throw new Error('Unauthorized: You can only delete your own auto-bids');
    }

    return await autoBid.destroy();
  }
};