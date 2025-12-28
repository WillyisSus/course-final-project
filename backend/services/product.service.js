import models from '../utils/db.js'; //
import { Op } from 'sequelize';
import { sequelize } from '../utils/db.js'; //
export const ProductService = {

  // I'll fetch active products that haven't expired yet for the main list
  async findActiveProducts({ limit = 10, offset = 0, searchQuery = null } = {}) {
    console.log('Search Query:', searchQuery);
    const whereClause = {
      status: 'ACTIVE',
      end_date: {
        [Op.gt]: new Date() 
      }
    };

    let orderClause = [['end_date', 'ASC']];

    if (searchQuery) {
      // 1. Sanitize input to prevent SQL injection
      const safeQuery = sequelize.escape(searchQuery);
      
      // 2. Full-Text Search Logic
      // MATCHES TRIGGER: uses 'simple' config and 'unaccent' function
      whereClause[Op.and] = [
        sequelize.literal(`tsv @@ plainto_tsquery('simple', unaccent(${safeQuery}))`)
      ];
      // 3. Order by Rank (Relevance)
      // We calculate rank using the exact same logic
      orderClause = [
        [sequelize.literal(`ts_rank(tsv, plainto_tsquery('simple', unaccent(${safeQuery})))`), 'DESC'],
        ['end_date', 'ASC']
      ];
    }
    return await models.products.findAll({
      where: whereClause,
      attributes: [
        'product_id', 'name', 'price_current', 'price_buy_now', 
        'end_date', 'start_date', 'created_at', 'tsv'
      ],
      include: [
        {
          model: models.categories,
          as: 'category',
          attributes: ['name']
        },
        {
          model: models.product_images,
          as: 'product_images',
          where: { is_primary: true },
          attributes: ['image_url'],
          required: false 
        },
        {
          model: models.users,
          as: 'seller',
          attributes: ['full_name', 'positive_rating']
        }
      ],
      order: orderClause,
      limit,
      offset
    });
  },

  // getting all the deep details for the single product page
  async findProductDetail(productId) {
    const product = await models.products.findOne({
      where: { product_id: productId },
      include: [
        {
          model: models.product_descriptions,
          as: 'product_descriptions', //
          attributes: ['content']
        },
        {
          model: models.product_images,
          as: 'product_images', //
          attributes: ['image_url', 'is_primary']
        },
        {
          model: models.categories,
          as: 'category', //
          attributes: ['category_id', 'name']
        },
        {
          model: models.users,
          as: 'seller', //
          attributes: ['user_id', 'full_name', 'positive_rating', 'negative_rating']
        }
      ]
    });

    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  },
  // basic creation logic, I'll handle images/descriptions in a separate step or transaction later
  async createProduct(productData, sellerId) {
    const initialData = {
      ...productData,
      seller_id: sellerId,
      status: 'ACTIVE',
      price_current: productData.price_start, // start price is the current price initially
      start_date: productData.start_date || new Date(),
    };

    return await models.products.create(initialData);
  },
  // locking out a bad bidder from my auction
  async blockBidder(productId, sellerId, userIdToBlock, reason) {
    // checking if I actually own this product before blocking someone
    const product = await models.products.findByPk(productId);
    
    if (!product) throw new Error('Product not found');
    if (product.seller_id !== sellerId) {
      throw new Error('Unauthorized: I can only block bidders on my own products');
    }

    // adding them to the block list
    return await models.blocked_bidders.create({
      product_id: productId,
      user_id: userIdToBlock,
      reason: reason || 'Blocked by seller',
      blocked_at: new Date()
    });
  },
  // updating product details, but only if no bids have been placed yet
  async updateProduct(productId, sellerId, updateData) {
    const product = await models.products.findByPk(productId);

    if (!product) throw new Error('Product not found');
    if (product.seller_id !== sellerId) {
      throw new Error('Unauthorized: I can only update my own products');
    }

    // preventing updates if someone has already bid, to keep it fair
    const bidCount = await models.bids.count({ where: { product_id: productId } });
    if (bidCount > 0) {
      throw new Error('Cannot update product: Bids have already been placed');
    }

    // ensuring I don't accidentally set current price lower than start price if I change start price
    if (updateData.price_start && (!updateData.price_current || updateData.price_current < updateData.price_start)) {
        updateData.price_current = updateData.price_start;
    }

    return await product.update(updateData);
  },
  // deleting a product, strictly checking ownership and bid status
  async deleteProduct(productId, sellerId) {
      const product = await models.products.findByPk(productId);

      if (!product) throw new Error('Product not found');
      if (product.seller_id !== sellerId) {
      throw new Error('Unauthorized: I can only delete my own products');
      }

      // if bids exist, I can't delete it, I should probably mark it as CANCELLED instead, but for now I'll just block delete
      const bidCount = await models.bids.count({ where: { product_id: productId } });
      if (bidCount > 0) {
      throw new Error('Cannot delete product: Bids have already been placed');
      }

      // hard delete since no interaction has happened yet
      return await product.destroy();
  }
};