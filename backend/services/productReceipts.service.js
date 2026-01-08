import models from '../utils/db.js'; // Assuming this exports your initialized models

export const ProductReceiptService = {
  
  // 1. Create a Receipt (Usually called when Auction ends or Buy Now is clicked)
  async createReceipt(data) {
    // data = { product_id, buyer_id, seller_id, amount }
    return await models.product_receipts.create({
        ...data,
        paid_by_buyer: false,
        confirmed_by_seller: false,
        confirmed_by_buyer: false,
        created_at: new Date()
    });
  },

  // 2. Get details of a specific receipt
  async getReceiptById(receiptId) {
    return await models.product_receipts.findByPk(receiptId, {
      include: [
        { 
          model: models.products, 
          as: 'product',
          attributes: ['product_id', 'name', 'price_current', 'status'] 
        },
        { 
          model: models.users, 
          as: 'buyer', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: models.users, 
          as: 'seller', 
          attributes: ['user_id', 'full_name', 'email'] 
        }
      ]
    });
  },

  // 3. Get all receipts involved with a user (either as Buyer or Seller)
  async getUserReceipts(userId) {
    const { Op } = models.Sequelize;
    return await models.product_receipts.findAll({
      where: {
        [Op.or]: [
          { buyer_id: userId },
          { seller_id: userId }
        ]
      },
      order: [['created_at', 'DESC']],
      include: [
        { model: models.products, as: 'product', attributes: ['name'] }
      ]
    });
  },
  async getReceiptByProductId(productId) {
    if (!productId) throw new Error("Product ID is required");
    return await models.product_receipts.findOne({
      where: { product_id: productId },
    });
  },
  // 4. Update Receipt Status (Smart Update)
  async updateReceiptStatus(receiptId, userId, updateData) {
    const receipt = await models.product_receipts.findByPk(receiptId);
    if (!receipt) throw new Error("Receipt not found");

    // Logic: Only allow specific updates based on who the user is
    const isBuyer = receipt.buyer_id === userId;
    const isSeller = receipt.seller_id === userId;

    if (!isBuyer && !isSeller) {
        throw new Error("You are not authorized to update this receipt.");
    }

    // Buyer Actions
    if (isBuyer) {
        if (updateData.paid_by_buyer !== undefined) receipt.paid_by_buyer = updateData.paid_by_buyer;
        if (updateData.confirmed_by_buyer !== undefined) receipt.confirmed_by_buyer = updateData.confirmed_by_buyer;
    }

    // Seller Actions
    if (isSeller) {
        if (updateData.confirmed_by_seller !== undefined) receipt.confirmed_by_seller = updateData.confirmed_by_seller;
    }

    await receipt.save();
    return receipt;
  }
};