import models from "./db.js";
import { Op } from "sequelize";
const findExpiredAuctionsAndCreateReceipts = async () => {
    try {
        const expiredProducts = await models.products.findAll({
            where: {
                status: 'SOLD',
                winner_id: { [Op.ne]: null }
            },
            include: [
                {
                    model: models.product_receipts,
                    as: 'receipt',
                    required: false
                }
            ]
        })
        console.log(`Found ${expiredProducts.length} expired products with winners.`);
        
        const promises = expiredProducts.map(element => {
            if (!element.product_receipt) {
                return models.product_receipts.create({
                    product_id: element.product_id,
                    buyer_id: element.winner_id,
                    seller_id: element.seller_id,
                    amount: element.price_current,
                });
            }
        });
        await Promise.all(promises);
    } catch (error) {
        console.error("Error in creating receipts for expired auctions: ", error);
    }

}

findExpiredAuctionsAndCreateReceipts();