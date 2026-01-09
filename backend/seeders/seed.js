import models, {sequelize}from '../utils/db.js';
import { AutoBidService } from '../services/autobids.service.js';
import bcrypt from 'bcryptjs';
import { is } from 'zod/locales';
const seedDatabase = async () => {
    console.log("Starting Database Reset & Smart Seed...");

    // We use a transaction for the Setup phase
    const t = await sequelize.transaction();

    try {
        // ============================================================
        // 1. CLEAN DATABASE (Nuke)
        // ============================================================
        console.log("Cleaning database...");
        
        // Order matters for Foreign Keys. Delete children first.
        if (models.product_images) await models.product_images.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.product_descriptions) await models.product_descriptions.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.auto_bids) await models.auto_bids.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.bids) await models.bids.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.products) await models.products.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.categories) await models.categories.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.users) await models.users.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.watchlists) await models.watchlists.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.upgrade_requests) await models.upgrade_requests.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.product_receipts) await models.product_receipts.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.blocked_bidders) await models.blocked_bidders.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.messages) await models.messages.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        if (models.product_comments) await models.product_comments.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true, transaction: t });
        console.log("Database Cleaned.\n");

        // ============================================================
        // 2. CREATE USERS
        // ============================================================
        console.log("Creating Users...");
        const commonPassword = await bcrypt.hash("Password123!", 10);
        const now = new Date();
        // Define users exactly as requested
        const usersData = [
            { email: "vovietlong0845927889@gmail.com", full_name: "Super Admin", role: "ADMIN", password_hash: commonPassword, positive_rating: 100, negative_rating: 0,  address: "123 Admin St, Admin City", is_verified: true },
            { email: "vovietlong01082004abc@gmail.com", full_name: "Main Seller", role: "SELLER", password_hash: commonPassword, positive_rating: 100, negative_rating: 0,seller_exp_date: (new Date(now)).setDate(now.getDate() + 7),address: "123 Seller St, Seller City",  is_verified: true  },
            { email: "aszx134679852abc@gmail.com", full_name: "Bidder Alpha", role: "BIDDER", password_hash: commonPassword,  positive_rating: 100, negative_rating: 0, address: "123 Bidder St, Bidder City",  is_verified: true  },
            { email: "vvlong22@clc.fitus.edu.vn", full_name: "Bidder Beta", role: "BIDDER", password_hash: commonPassword, positive_rating: 100, negative_rating: 0, address: "123 Bidder St, Bidder City",  is_verified: true   },
            { email: "willydalong01082004@gmail.com", full_name: "Bidder Gamma", role: "BIDDER", password_hash: commonPassword, positive_rating: 100, negative_rating: 0, address: "123 Bidder St, Bidder City",  is_verified: true   },
        ];

        const createdUsers = await models.users.bulkCreate(usersData, { transaction: t, returning: true });
        
        // Map users for later use
        const seller = createdUsers.find(u => u.email === "vovietlong01082004abc@gmail.com");
        const bidders = createdUsers.filter(u => u.role === "BIDDER"); // The 3 bidders

        // ============================================================
        // 3. CREATE CATEGORIES
        // ============================================================
        console.log("Creating Categories...");

        // Parent Categories
        const electronics = await models.categories.create({ name: "Electronics" }, { transaction: t });
        const collectibles = await models.categories.create({ name: "Collectibles" }, { transaction: t });
        const others = await models.categories.create({ name: "Others" }, { transaction: t });

        // Sub Categories (Atomic)
        const smartphones = await models.categories.create({ name: "Smartphones", parent_id: electronics.category_id }, { transaction: t });
        const laptops = await models.categories.create({ name: "Laptops", parent_id: electronics.category_id }, { transaction: t });
        const tradingCards = await models.categories.create({ name: "Trading Cards", parent_id: collectibles.category_id }, { transaction: t });
        const relics = await models.categories.create({ name: "Relics", parent_id: collectibles.category_id }, { transaction: t });

        // List of categories to assign products to
        const atomicCategories = [smartphones, laptops, tradingCards, relics, others];

        // ============================================================
        // 4. CREATE PRODUCTS
        // ============================================================
        console.log("Creating 20 Products...");
        const productsList = [];
        
        const threeDaysLater = new Date(now); threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        for (let i = 1; i <= 20; i++) {
            const category = atomicCategories[(i - 1) % atomicCategories.length]; // Round robin assignment
            
            const product = await models.products.create({
                name: `Rare Item #${i} - ${category.name} Edition`,
                seller_id: seller.user_id,
                category_id: category.category_id,
                price_start: 100.00*1000,
                price_step: 10.00*1000,
                price_current: null, // Initial state
                price_buy_now: 1000.00*1000,
                start_date: now,
                end_date: threeDaysLater,
                status: 'ACTIVE',
                // Inline Associations for Images & Descriptions
                product_descriptions: [
                    { content: `Official description for Item #${i}.` },
                    { content: "Mint condition, original packaging." },
                    { content: "Fast shipping available." },
                    { content: "Seller warranty included." }
                ],
                product_images: [
                    { image_url: `https://placehold.co/600x400?text=Item+${i}+Main`, is_primary: true },
                    { image_url: `https://placehold.co/600x400?text=Item+${i}+Side`, is_primary: false },
                    { image_url: `https://placehold.co/600x400?text=Item+${i}+Back`, is_primary: false },
                    { image_url: `https://placehold.co/600x400?text=Item+${i}+Detail`, is_primary: false }
                ]
            }, { 
                transaction: t,
                include: [
                    { model: models.product_descriptions, as: 'product_descriptions' },
                    { model: models.product_images, as: 'product_images' }
                ]
            });
            productsList.push(product);
        }

        // COMMIT SETUP TRANSACTION
        // We commit here because the AutoBidService might start its own transactions 
        // or require the products to be visible in the DB to query them.
        await t.commit(); 
        console.log("Basic Data Created. Starting Simulation...");

        // ============================================================
        // 5. SIMULATE AUTO-BIDS via SERVICE
        // ============================================================
        console.log("Placing Auto-Bids using AutoBidService...");

        // For each product, we will have all 3 bidders place auto-bids.
        // To ensure they are valid, we stagger their max_prices.
        // Bidder 1: Max $200 -> Becomes Winner @ $100
        // Bidder 2: Max $300 -> Becomes Winner @ $210 (outbids B1)
        // Bidder 3: Max $500 -> Becomes Winner @ $310 (outbids B2)

        for (const product of productsList) {
            console.log(`\n--- Bidding on Product ${product.product_id} ---`);

            // Scenario: 3 Bidders with increasing Max Prices
            const bidScenarios = [
                { bidder: bidders[0], maxPrice: 200*1000 },
                { bidder: bidders[1], maxPrice: 300*1000 },
                { bidder: bidders[2], maxPrice: 500*1000 }
            ];

            for (const scenario of bidScenarios) {
                try {
                    // 1. Create the AutoBid Record
                    // Service checks: Valid Product? Seller!=Bidder? Price Logic?
                    await AutoBidService.createAutoBid(
                        product.product_id,
                        scenario.bidder.user_id,
                        scenario.maxPrice
                    );

                    // 2. Trigger the Calculation Logic
                    // This is what generates the entry in the 'bids' table and updates 'products.price_current'
                    // Your Service requires: productId, newBidderId, maxPrice
                    await AutoBidService.calculateAutoBids(
                        product.product_id,
                        scenario.bidder.user_id,
                        scenario.maxPrice
                    );
                    
                    console.log(`   > ${scenario.bidder.full_name} placed auto-bid up to $${scenario.maxPrice}`);
                } catch (error) {
                    console.error(`   Failed to place bid for ${scenario.bidder.email}: ${error.message}`);
                }
            }
        }

        // Update their original auto-bid max prices to simulate further bidding
        // (Not required, but shows ability to update and re-calculate)
        console.log("\nUpdating Auto-Bid Max Prices and Recalculating...");
        for (const product of productsList) {
            const updatedMaxPrices = [250*1000, 400*1000, 600*1000]; // New max prices for bidders 1, 2, 3
            for (let i = 0; i < bidders.length; i++) {
                const bidder = bidders[i];
                const newMax = updatedMaxPrices[i];
                try {
                    const autoBidRecord = await models.auto_bids.findOne({
                        where: { product_id: product.product_id, bidder_id: bidder.user_id }
                    });
                    if (autoBidRecord) {
                        autoBidRecord.max_price = newMax;
                        await autoBidRecord.save();
                        // Recalculate bids
                        await AutoBidService.calculateAutoBids(
                            product.product_id,
                            bidder.user_id,
                            newMax
                        );
                        console.log(`   > ${bidder.full_name} updated auto-bid to $${newMax}`);
                    }
                } catch (error) {
                    console.error(`   Failed to update bid for ${bidder.email}: ${error.message}`);
                }
            }
        }

        // FINAL LOG
        console.log("\nDatabase Seeded Successfully!");
        console.log(`   - Seller: ${seller.email}`);
        console.log(`   - Password: Password123!`);
        console.log(`   - Products: 20 active items`);
        console.log(`   - Bidding: Processed via AutoBidService logic`);
        
        process.exit(0);

    } catch (error) {
        // Only rollback if the main setup transaction failed.
        // If error happened during bidding loop, setup is already committed (which is usually preferred for debugging).
        if (t && !t.finished) await t.rollback();
        
        console.error("\n❌ Seeding Fatal Error:", error);
        process.exit(1);
    }
};

seedDatabase();