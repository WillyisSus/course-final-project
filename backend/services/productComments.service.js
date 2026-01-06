import models from '../utils/db.js';

export const ProductCommentService = {

  // Fetch Q&A tree: Questions (root) -> Replies (children)
  async findAllByProduct(productId) {
    return await models.product_comments.findAll({
      where: { 
        product_id: productId,
        parent_id: null // Get top-level questions only
      },
      include: [
        {
          model: models.users,
          as: 'user', // The person asking
          attributes: ['user_id', 'full_name']
        },
        {
          model: models.product_comments,
          as: 'replies', // The seller's answer(s)
          include: [{
             model: models.users,
             as: 'user', // The person replying
             attributes: ['user_id', 'full_name', 'role'] // Role helps show 'SELLER' tag
          }]
        }
      ],
      order: [
        ['created_at', 'DESC'], // Newest questions first
        [{ model: models.product_comments, as: 'replies' }, 'created_at', 'ASC'] // Oldest replies first (chronological)
      ]
    });
  },
  async findCommentById(commentId) {
    return await models.product_comments.findByPk(commentId, {
      include: [
        {
          model: models.users,
          as: 'user',
          attributes: ['user_id', 'full_name', 'positive_rating', 'negative_rating', 'created_at']
        }
      ]
    });
  },
  async createComment(productId, userId, content, parentId = null) {
    // 1. Verify Product exists
    const product = await models.products.findByPk(productId);
    if (!product) throw new Error('Product not found');

    // 2. If this is a Reply, verify the Parent exists and belongs to the same product
    if (parentId) {
      const parentComment = await models.product_comments.findByPk(parentId);
      if (!parentComment) throw new Error('Parent comment not found');
      if (parentComment.product_id != productId) { // Loose equality for ID check
        throw new Error('Reply must belong to the same product as the parent comment');
      }
    }

    // 3. Create the record
    return await models.product_comments.create({
      product_id: productId,
      user_id: userId,
      parent_id: parentId,
      content
    });
  },

  // Optional: Delete comment (Ownership or Admin check required in Controller)
  async deleteComment(commentId, userId) {
    const comment = await models.product_comments.findByPk(commentId);
    if (!comment) throw new Error('Comment not found');

    // Allow deletion if user owns the comment OR is the product owner
    const product = await models.products.findByPk(comment.product_id);
    
    if (comment.user_id !== userId && product.seller_id !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    return await comment.destroy();
  }
};