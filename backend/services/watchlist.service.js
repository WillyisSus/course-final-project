import models from '../utils/db.js'; //

export const WatchlistService = {

  // Fetch a user's entire watchlist with product details
  async findAllWatchlistItems(userId) {
    return await models.watchlists.findAll({
      where: { user_id: userId }, //
      include: [
        {
          model: models.products,
          as: 'product', //
          attributes: ['product_id', 'name', 'price_current', 'end_date', 'status'],
          include: [
             {
              model: models.users,
              as: 'seller',
              attributes: ['full_name']
             }
          ]
        }
      ]
    });
  },
  async findWatchlistItem(userId, productId) {
    return await models.watchlists.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });
  },
  async addToWatchlist(userId, productId) {
    // Check if product exists first
    const product = await models.products.findByPk(productId);
    if (!product) throw new Error('Product not found');

    // Use findOrCreate to avoid duplicates without throwing error
    const [entry, created] = await models.watchlists.findOrCreate({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    if (!created) throw new Error('Product is already in watchlist');
    return entry;
  },

  // Watchlists don't really have "Updates" (it's binary: there or not), so we skip Update

  async removeFromWatchlist(userId, productId) {
    const entry = await models.watchlists.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    if (!entry) throw new Error('Item not found in watchlist');
    return await entry.destroy();
  }
};