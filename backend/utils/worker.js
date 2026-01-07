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

        // --- STEP 1: FIND AND LOCK THE PRODUCTS (No Includes) ---
        // We only fetch the product_id to lock the rows. 
        // We avoid 'include' here to prevent the "nullable side of outer join" error.
        const lockedProducts = await models.products.findAll({
            where: {
                status: 'ACTIVE',
                end_date: { [Op.lt]: now }
            },
            attributes: ['product_id'], // We only need the ID for now
            transaction,
            lock: transaction.LOCK.UPDATE 
        });

        if (lockedProducts.length === 0) {
            await transaction.commit();
            return;
        }

        const lockedIds = lockedProducts.map(p => p.product_id);
        console.log(`Found and locked ${lockedIds.length} expired auctions.`);

        // --- STEP 2: FETCH FULL DETAILS ---
        // Now that rows are locked, we fetch the relations needed for emails.
        // We do NOT use 'lock' here, because the transaction already holds the locks from Step 1.
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
                        as: 'bidder', // Ensure this alias matches your Bid model association (e.g., 'user' or 'bidder')
                        attributes: ['user_id', 'email', 'full_name'] 
                    }]
                }
            ],
            transaction
        });

        // --- STEP 3: PROCESS UPDATES ---
        for (const product of productsToProcess) {
            
            // Scenario A: There is a winner
            if (product.winner) {
                console.log(`Closing Product #${product.product_id}. Winner: ${product.winner.email}`);

                await product.update({ status: 'SOLD' }, { transaction });

                // Notify Winner
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

                // Notify Losers
                if (product.bids && product.bids.length > 0) {
                    const loserEmails = new Set();
                    product.bids.forEach(bid => {
                        // Alias check: Ensure you access the user correctly (bid.user vs bid.bidder) based on your include above
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