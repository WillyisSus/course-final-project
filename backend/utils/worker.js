import cron from 'node-cron';
import { Op } from 'sequelize';
import models from '../utils/db.js';
import { sequelize } from '../utils/db.js';
import { sendEmail, emailTemplates } from '../utils/email.js';

const checkExpiredAuctions = async () => {
    console.log("Running Auction Worker: Checking for expired auctions...");
    
    const transaction = await sequelize.transaction();

    try {
        const now = new Date();

        const lockedProducts = await models.products.findAll({
            where: {
                status: 'ACTIVE',
                end_date: { [Op.lt]: now }
            },
            attributes: ['product_id'], 
            transaction,
            lock: transaction.LOCK.UPDATE 
        });

        if (lockedProducts.length === 0) {
            await transaction.commit();
            return;
        }

        const lockedIds = lockedProducts.map(p => p.product_id);
        console.log(`Found and locked ${lockedIds.length} expired auctions.`);

        const productsToProcess = await models.products.findAll({
            where: {
                product_id: lockedIds
            },
            include: [
                {
                    model: models.users,
                    as: 'winner', 
                    attributes: ['user_id', 'email', 'full_name']
                },
                {
                    model: models.bids,
                    as: 'bids',
                    include: [{ 
                        model: models.users, 
                        as: 'bidder', 
                        attributes: ['user_id', 'email', 'full_name'] 
                    }]
                }
            ],
            transaction
        });

        for (const product of productsToProcess) {
            
            // Scenario A: There is a winner
            if (product.winner) {
                console.log(`Closing Product #${product.product_id}. Winner: ${product.winner.email}`);

                await product.update({ status: 'SOLD' }, { transaction });

                await models.product_receipts.create({
                    product_id: product.product_id,
                    buyer_id: product.winner.user_id, // Winner is the buyer
                    seller_id: product.seller_id,     // Product has seller_id by default
                    amount: product.price_current,    // Final Auction Price
                    created_at: new Date(),
                    paid_by_buyer: false,
                    confirmed_by_buyer: false,
                    confirmed_by_seller: false,
                    status: 'PENDING'
                }, { transaction });

                const winnerEmailContent = emailTemplates.auctionWinner(
                    product.winner.full_name,
                    product.name,
                    product.price_current
                );
                
                sendEmail({
                    to: product.winner.email,
                    subject: winnerEmailContent.subject,
                    html: winnerEmailContent.html
                });

                if (product.bids && product.bids.length > 0) {
                    const loserEmails = new Set();
                    product.bids.forEach(bid => {
                        const bidderUser = bid.user || bid.bidder; 
                        if (bidderUser && bidderUser.user_id !== product.winner.user_id) {
                            loserEmails.add(bidderUser.email);
                        }
                    });

                    loserEmails.forEach(email => {
                        sendEmail({
                            to: email,
                            subject: `Auction Ended: ${product.name}`,
                            html: `
                                <div style="font-family: sans-serif; padding: 20px;">
                                    <h3>Auction Ended</h3>
                                    <p>The auction for <b>${product.name}</b> has ended.</p>
                                    <p>Unfortunately, you did not win this time. The final price was <b>$${Number(product.price_current).toLocaleString()}</b>.</p>
                                    <p>Better luck next time!</p>
                                </div>
                            `
                        });
                    });
                }

            } else {
                // Scenario B: No bids / No winner set
                console.log(`Closing Product #${product.product_id}. No winner/bids.`);
                await product.update({ status: 'EXPIRED' }, { transaction }); 
            }
        }

        await transaction.commit();
        console.log("Auction Worker: Update complete.");

    } catch (error) {
        console.error("Auction Worker Error:", error);
        await transaction.rollback();
    }
};

const startWorker = () => {
    cron.schedule('*/1 * * * *', () => {
        checkExpiredAuctions();
    });
    console.log(" Auction Worker started (running every minute)");
};

export default startWorker;