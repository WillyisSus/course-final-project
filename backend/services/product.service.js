import models from '../utils/db.js'; //
import { Op } from 'sequelize';
import { sequelize } from '../utils/db.js'; //
export const ProductService = {

  // I'll fetch active products that haven't expired yet for the main list
  async  findAllProducts({ 
    limit = 10, 
    offset = 0, 
    searchQuery = null, 
    sortBy = 'end_date', 
    sortOrder = 'ASC',
    status = null,
    category= null, // <--- NEW: Defaults to ACTIVE
    sellerId = null
  } = {}) {
    console.log('Search Query:', searchQuery);
    const whereClause = {};
    
    // Only filter by status if a specific status is requested (pass null to get EVERYTHING)
    if (status === 'ACTIVE') {
      whereClause.end_date = { [Op.gt]: new Date() };
    }

    // 2. Search Logic (Same as before)
    if (searchQuery) {
      const safeQuery = sequelize.escape(searchQuery);
      whereClause[Op.and] = [
        sequelize.literal(`"products"."tsv" @@ plainto_tsquery('simple', unaccent(${safeQuery}))`)
      ];
    }
    if (category){
      whereClause.category_id = category
    }
    if (sellerId){
      whereClause.seller_id = sellerId
    }
    let orderClause = [];
    if (sortBy === 'bid_count') {
      orderClause = [[sequelize.literal('bid_count'), sortOrder]];
    } else if (searchQuery && sortBy === 'relevance') {
       const safeQuery = sequelize.escape(searchQuery);
       orderClause = [
        [sequelize.literal(`ts_rank("products"."tsv", plainto_tsquery('simple', unaccent(${safeQuery})))`), 'DESC']
      ];
    } else {
      orderClause = [[sortBy, sortOrder]];
    }
    return await models.products.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit,
      offset,
      attributes: [
        'product_id', 'name', 'price_current', 'price_buy_now', 'price_start', 
        'end_date', 'start_date', 'created_at', 'winner_id', 'status', 'allow_first_time_bidder',  // Added status to return attributes
        [
          sequelize.literal(`(
            SELECT COUNT(*)::int 
            FROM bids 
            WHERE bids.product_id = products.product_id
          )`), 
          'bid_count'
        ]
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
          as: 'winner',
          attributes: ['full_name'] 
        },
        {
          model: models.users,
          as: 'seller',
          attributes: ['full_name', 'positive_rating']
        },{
          model: models.product_receipts,
          as: 'receipt',
          required: false
        }

      ],
     
    });
  },
  // Basic fetch, no associations
  async findProductById(productId) {
    return await models.products.findByPk(productId);
  },
  // getting all the deep details for the single product page
  async findProductDetail(productId) {
    const product = await models.products.findOne({
      where: { product_id: productId },
      include: [
        {
          model: models.product_descriptions,
          as: 'product_descriptions', //
          attributes: ['content', 'desc_id', 'created_at']
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
        },{
          model: models.users,
          as: 'winner', //
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
      price_current: null, // start price is the current price initially
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
    if ((updateData.price_current && updateData.price_current != product.price_current )
      || (updateData.price_start && updateData.price_start != product.price_start ) || 
        (updateData.price_buy_now && updateData.price_buy_now != product.price_buy_now )) {
      // preventing updates if someone has already bid, to keep it fair
      const bidCount = await models.bids.count({ where: { product_id: productId } });
      if (bidCount > 0) {
        throw new Error('Cannot update product prices: Bids have already been placed');
      }
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
      const user = await models.users.findByPk(sellerId);
      if (!product) throw new Error('Product not found');
      if (user.role != 'ADMIN' && product.seller_id !== sellerId) {
      throw new Error('Unauthorized: I can only delete my own products');
      }

      // if bids exist, I can't delete it, I should probably mark it as CANCELLED instead, but for now I'll just block delete
      const bidCount = await models.bids.count({ where: { product_id: productId } });
      if (bidCount > 0) {
      throw new Error('Cannot delete product: Bids have already been placed');
      }

      // hard delete since no interaction has happened yet
      return await product.destroy();
  },
};