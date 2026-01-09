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
            if (product.winner) {
                console.log(`Closing Product #${product.product_id}. Winner: ${product.winner.email}`);
                await product.update({ status: 'EXPIRED' }, { transaction }); 

                await models.product_receipts.create({
                    product_id: product.product_id,
                    buyer_id: product.winner.user_id,
                    seller_id: product.seller_id,
                    amount: product.price_current,
                    created_at: new Date(),
                    paid_by_buyer: false,
                    confirmed_by_buyer: false,
                    confirmed_by_seller: false,
                    status: 'PENDING'
                }, { transaction });

                // Emails...
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

const checkExpiredSellers = async () => {
    const transaction = await sequelize.transaction();
    try {
        const now = new Date();

        // Find Sellers who have expired
        const expiredSellers = await models.users.findAll({
            where: {
                role: 'SELLER',
                seller_exp_date: { 
                    [Op.or]: {
                        [Op.lt]: now, 
                        [Op.eq]: null //check if expiration date is null
                    }
                } // Expiration date is in the past
            },
            transaction,
            lock: transaction.LOCK.UPDATE // Lock rows to prevent race conditions
        });

        if (expiredSellers.length === 0) {
            await transaction.commit();
            return;
        }

        console.log(`Found ${expiredSellers.length} expired sellers. Downgrading...`);

        for (const user of expiredSellers) {
            // 1. Update User Record
            await user.update({
                role: 'BIDDER',           // Downgrade Role
                refresh_token: null,      // Strip Refresh Token (Forces Logout/Re-login)
                seller_exp_date: null     // Remove Expiration Date
            }, { transaction });

            // 2. Send Notification Email
            await sendEmail({
                to: user.email,
                subject: "Seller Subscription Expired - Account Downgraded",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #d9534f;">Subscription Expired</h2>
                        <p>Hello <b>${user.full_name}</b>,</p>
                        <p>Your Seller subscription period has ended as of today.</p>
                        <hr />
                        <p><b>Changes to your account:</b></p>
                        <ul>
                            <li>Your account role has been changed to <b>BIDDER</b>.</li>
                            <li>You can no longer post new products for auction.</li>
                            <li>Your existing active auctions will remain active until they finish.</li>
                        </ul>
                        <p>If you wish to continue selling, please request a Seller Upgrade again from your profile.</p>
                        <br/>
                        <p>Best regards,<br/>The Big Biddie Team</p>
                    </div>
                `
            });
            
            console.log(`User [${user.user_id}] ${user.email} downgraded to BIDDER.`);
        }

        await transaction.commit();

    } catch (error) {
        console.error("Seller Expiry Worker Error:", error);
        await transaction.rollback();
    }
};

const startWorker = () => {
    // Run every minute
    cron.schedule('*/1 * * * *', () => {
        // 1. Check Auctions
        checkExpiredAuctions();
        
        // 2. Check Seller Subscriptions
        checkExpiredSellers();
    });
    console.log("Worker started (running every minute)");
};

export default startWorker;