import models from '../utils/db.js'; //

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
    return await models.auto_bids.create({
      product_id: productId,
      bidder_id: bidderId,
      max_price: maxPrice
    });
  },

  // Fetching all auto-bids for a specific product
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