import models from '../utils/db.js'; //

export const ProductDescriptionService = {

  // Get all description chunks for a product
  async findAllDescriptionsByProduct(productId) {
    return await models.product_descriptions.findAll({
      where: { product_id: productId }, //
      order: [['desc_id', 'ASC']] // Oldest description first
    });
  },

  // Add a new description paragraph
  async createDescription(productId, sellerId, content) {
    // Verify product ownership
    const product = await models.products.findByPk(productId);
    if (!product) throw new Error('Product not found');
    if (product.seller_id !== sellerId) throw new Error('Unauthorized');

    return await models.product_descriptions.create({
      product_id: productId,
      content: content
    });
  },

  // Edit a specific description chunk
  async updateDescription(descId, sellerId, newContent) {
    const description = await models.product_descriptions.findByPk(descId);
    if (!description) throw new Error('Description not found');

    // Verify ownership via the associated product
    const product = await models.products.findByPk(description.product_id);
    if (product.seller_id !== sellerId) throw new Error('Unauthorized');

    return await description.update({
      content: newContent
    });
  },

  // Remove a description chunk
  async deleteDescription(descId, sellerId) {
    const description = await models.product_descriptions.findByPk(descId);
    if (!description) throw new Error('Description not found');

    const product = await models.products.findByPk(description.product_id);
    if (product.seller_id !== sellerId) throw new Error('Unauthorized');

    return await description.destroy();
  }
};