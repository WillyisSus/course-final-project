import models, { sequelize } from '../utils/db.js'; //

export const ProductImageService = {

  // Get all images for a product
  async findAllImagesByProduct(productId) {
    return await models.product_images.findAll({
      where: { product_id: productId }, //
      order: [['is_primary', 'DESC'], ['image_id', 'ASC']] // Primary first, then by ID
    });
  },

  // Add a new image
  async createImage(productId, sellerId, imageUrl, isPrimary = false) {
    const product = await models.products.findByPk(productId);
    if (!product) throw new Error('Product not found');
    if (product.seller_id !== sellerId) throw new Error('Unauthorized');

    return await sequelize.transaction(async (t) => {
      // If this new image is set to primary, we must unset any existing primary image
      if (isPrimary) {
        await models.product_images.update(
          { is_primary: false },
          { where: { product_id: productId }, transaction: t }
        );
      }

      return await models.product_images.create({
        product_id: productId,
        image_url: imageUrl,
        is_primary: isPrimary
      }, { transaction: t });
    });
  },

  // Update image details (e.g., swapping URL or setting as primary)
  async updateImage(imageId, sellerId, updateData) {
    const image = await models.product_images.findByPk(imageId);
    if (!image) throw new Error('Image not found');

    const product = await models.products.findByPk(image.product_id);
    if (product.seller_id !== sellerId) throw new Error('Unauthorized');

    // Transaction required if we are changing the primary status
    if (updateData.is_primary === true) {
      return await sequelize.transaction(async (t) => {
        // Demote all other images for this product
        await models.product_images.update(
          { is_primary: false },
          { where: { product_id: image.product_id }, transaction: t }
        );

        // Update the target image
        return await image.update(updateData, { transaction: t });
      });
    }

    // Standard update (e.g. just fixing a URL typo)
    return await image.update(updateData);
  },

  // Delete an image
  async deleteImage(imageId, sellerId) {
    const image = await models.product_images.findByPk(imageId);
    if (!image) throw new Error('Image not found');

    const product = await models.products.findByPk(image.product_id);
    if (product.seller_id !== sellerId) throw new Error('Unauthorized');

    // Optional safety: Prevent deleting the only primary image? 
    // For now, we allow it, but the frontend should handle the case of no primary image.
    return await image.destroy();
  }
};