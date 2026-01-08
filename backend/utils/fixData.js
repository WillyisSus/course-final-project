import models from "./db.js";
import { Op } from "sequelize";
const fixer = async () => {
    try {
        const expiredProducts = await models.products.findAll()
        const receipts = await models.product_receipts.findAll()
        const autoBids = await models.auto_bids.findAll()
        const bids = await models.bids.findAll()

        const productPromises = expiredProducts.map(async (product) => {
              return await product.update({
                price_buy_now: product.price_buy_now ? product.price_buy_now*1000 : null,
                price_current: product.price_buy_now ? product.price_buy_now*1000 : null,
                price_step: product.price_buy_now ? product.price_buy_now*1000 : null,
                price_start: product.price_start? product.price_start*1000 : null,
              })
            }
        )
        const receiptPromises = receipts.map(async (receipt) => {
                return await receipt.update({
                    amount: receipt.amount ? receipt.amount*1000 : null,
                })
            }
        )
        const autoBidPromises = autoBids.map(async (autoBid) => {
                return await autoBid.update({
                    max_price: autoBid.max_price ? autoBid.max_price*1000 : null,
                })
            }
        )
        const bidPromises = bids.map(async (bid) => {
                return await bid.update({
                    amount: bid.amount ? bid.amount*1000 : null,
                })
            }
        )
        await Promise.all([...productPromises, ...receiptPromises, ...autoBidPromises, ...bidPromises]);
        console.log("Data fixing completed successfully.");
    } catch (error) {
        console.error("Error in creating receipts for expired auctions: ", error);
    }

}

fixer();