'use strict';

import bcryptjs from 'bcryptjs';
import models, { sequelize } from '../utils/db.js';

const seedData = async () => {
  // ============================================
  // 1. SEED USERS (1 Admin + 1 Seller + 4 Bidders)
  // ============================================
  const hashedPassword = await bcryptjs.hash('password123', 10);

  const adminUser = await models.users.create({
    email: 'admin@auction.com',
    password_hash: hashedPassword,
    full_name: 'Admin User',
    address: '123 Admin Street, Admin City',
    dob: '1990-01-15',
    role: 'ADMIN',
    is_verified: true,
    positive_rating: 100,
    negative_rating: 0,
  });

  const sellerUser = await models.users.create({
    email: 'seller@auction.com',
    password_hash: hashedPassword,
    full_name: 'John Seller',
    address: '456 Seller Avenue, Seller City',
    dob: '1985-03-20',
    role: 'SELLER',
    is_verified: true,
    positive_rating: 95,
    negative_rating: 2,
  });

  const bidders = await Promise.all([
    models.users.create({
      email: 'bidder1@auction.com',
      password_hash: hashedPassword,
      full_name: 'Alice Johnson',
      address: '789 Bidder Lane, Bidder Town',
      dob: '1995-05-10',
      role: 'BIDDER',
      is_verified: true,
      positive_rating: 85,
      negative_rating: 1,
    }),
    models.users.create({
      email: 'bidder2@auction.com',
      password_hash: hashedPassword,
      full_name: 'Bob Smith',
      address: '321 Bidder Drive, Bidder City',
      dob: '1992-07-25',
      role: 'BIDDER',
      is_verified: true,
      positive_rating: 90,
      negative_rating: 0,
    }),
    models.users.create({
      email: 'bidder3@auction.com',
      password_hash: hashedPassword,
      full_name: 'Carol Williams',
      address: '654 Bidder Road, Bidder Village',
      dob: '1998-09-14',
      role: 'BIDDER',
      is_verified: true,
      positive_rating: 88,
      negative_rating: 2,
    }),
    models.users.create({
      email: 'bidder4@auction.com',
      password_hash: hashedPassword,
      full_name: 'David Brown',
      address: '987 Bidder Way, Bidder Point',
      dob: '1993-11-08',
      role: 'BIDDER',
      is_verified: true,
      positive_rating: 92,
      negative_rating: 1,
    }),
  ]);

  console.log('Creating users... OK');

  // ============================================
  // 2. SEED CATEGORIES (3 Parent + 2 Child)
  // ============================================
  const parentCategories = await Promise.all([
    models.categories.create({
      name: 'Electronics',
      parent_id: null,
    }),
    models.categories.create({
      name: 'Collectibles',
      parent_id: null,
    }),
    models.categories.create({
      name: 'Fashion',
      parent_id: null,
    }),
  ]);

  const childCategories = await Promise.all([
    models.categories.create({
      name: 'Smartphones',
      parent_id: parentCategories[0].category_id,
    }),
    models.categories.create({
      name: 'Trading Cards',
      parent_id: parentCategories[1].category_id,
    }),
  ]);

  const allCategories = [...parentCategories, ...childCategories];
  console.log('Creating categories... OK');

  // ============================================
  // 3. SEED PRODUCTS (24 products)
  // ============================================
  const productNames = [
    'iPhone 15 Pro Max',
    'Samsung Galaxy S24',
    'MacBook Air M3',
    'iPad Pro 12.9"',
    'Google Pixel 8',
    'Sony WH-1000XM5 Headphones',
    'Apple Watch Series 9',
    'Dell XPS 15 Laptop',
    'Nintendo Switch OLED',
    'PlayStation 5 Console',
    'Vintage Comic Book Collection',
    'Rare Pokémon Card - First Edition Charizard',
    'Limited Edition Action Figures Set',
    'Signed Baseball Card - Babe Ruth',
    'Authentic Rolex Submariner Watch',
    'Gucci Shoulder Bag',
    'Louis Vuitton Monogram Crossbody',
    'Hermès Silk Scarf',
    'Chanel No. 5 Perfume Set',
    'Vintage Leather Jacket',
    'Supreme Hoodie Limited Release',
    'Off-White Sneaker Collection',
    'Vintage Vinyl Records Bundle',
    'Art Deco Clock',
  ];

  const productDescriptions = [
    'Pristine condition, barely used, with all original accessories',
    'Excellent working condition, some minor cosmetic wear',
    'Like new, comes with original box and warranty',
    'Used but well-maintained, fully functional',
    'Great starter item for collectors',
    'Authentic and certified, museum quality',
    'Perfect for enthusiasts and professionals',
    'Rare find in this condition',
    'Highly sought after by collectors worldwide',
    'Investment piece with appreciation potential',
  ];

  const products = [];
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < productNames.length; i++) {
    const product = await models.products.create({
      seller_id: sellerUser.user_id,
      category_id: allCategories[Math.floor(Math.random() * allCategories.length)].category_id,
      name: productNames[i],
      price_start: 100 + i * 50,
      price_step: 10,
      price_buy_now: 1000 + i * 100,
      price_current: 100 + i * 50,
      start_date: new Date(startDate.getTime() + i * 60 * 60 * 1000),
      end_date: new Date(endDate.getTime() + i * 60 * 60 * 1000),
      is_auto_extend: true,
      status: 'ACTIVE',
    });

    await models.product_descriptions.create({
      product_id: product.product_id,
      content: productDescriptions[Math.floor(Math.random() * productDescriptions.length)],
    });

    products.push(product);
  }

  console.log('Creating products... OK');

  // ============================================
  // 4. SEED BIDS (7 bids per product)
  // ============================================
  let totalBids = 0;
  const bidsPerProduct = 7;

  for (const product of products) {
    let currentPrice = parseFloat(product.price_start);

    for (let bidIndex = 0; bidIndex < bidsPerProduct; bidIndex++) {
      currentPrice += parseFloat(product.price_step);

      const randomBidder = bidders[Math.floor(Math.random() * bidders.length)];

      const bidTime = new Date(
        product.start_date.getTime() + (bidIndex + 1) * 2 * 60 * 60 * 1000
      );

      await models.bids.create({
        product_id: product.product_id,
        bidder_id: randomBidder.user_id,
        amount: currentPrice,
        status: 'VALID',
        time: bidTime,
      });

      totalBids++;
    }

    await product.update({ price_current: currentPrice });
  }

  console.log('Creating bids... OK');

  // ============================================
  // 5. SEED AUTO BIDS
  // ============================================
  let autoBidCount = 0;
  const productsForAutoBids = products.slice(0, 10);

  for (const product of productsForAutoBids) {
    for (let i = 0; i < 2; i++) {
      const randomBidder = bidders[Math.floor(Math.random() * bidders.length)];
      const maxPrice = parseFloat(product.price_current) + 500 + Math.random() * 500;

      try {
        await models.auto_bids.create({
          product_id: product.product_id,
          bidder_id: randomBidder.user_id,
          max_price: maxPrice,
        });
        autoBidCount++;
      } catch (err) {
        // Ignore unique constraint violations
      }
    }
  }

  console.log('Creating auto bids... OK');

  // ============================================
  // 6. SEED PRODUCT IMAGES
  // ============================================
  const imageUrls = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500',
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500',
    'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500',
  ];

  let imageCount = 0;

  for (const product of products) {
    const imagesPerProduct = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < imagesPerProduct; i++) {
      await models.product_images.create({
        product_id: product.product_id,
        image_url: imageUrls[Math.floor(Math.random() * imageUrls.length)],
        is_primary: i === 0,
      });
      imageCount++;
    }
  }

  console.log('Creating product images... OK');

  // ============================================
  // 7. SEED WATCHLISTS
  // ============================================
  let watchlistCount = 0;

  for (const bidder of bidders) {
    const watchCount = Math.floor(Math.random() * 3) + 3;
    const shuffledProducts = products.sort(() => 0.5 - Math.random()).slice(0, watchCount);

    for (const product of shuffledProducts) {
      try {
        await models.watchlists.create({
          user_id: bidder.user_id,
          product_id: product.product_id,
        });
        watchlistCount++;
      } catch (err) {
        // Ignore duplicates
      }
    }
  }

  console.log('Creating watchlists... OK');

  // ============================================
  // 8. SEED FEEDBACKS
  // ============================================
  let feedbackCount = 0;

  const feedbackComments = [
    'Great item, excellent condition!',
    'Fast shipping, very satisfied',
    'Exactly as described, would buy again',
    'Outstanding seller, highly recommended',
    'Perfect transaction, no issues',
    'Item arrived safely and in perfect condition',
    'Very responsive to questions',
    'Authentic and high quality',
    'Best auction experience ever',
    'Trustworthy and reliable',
  ];

  for (const product of products) {
    const feedbacksPerProduct = Math.floor(Math.random() * 2) + 2;

    for (let i = 0; i < feedbacksPerProduct; i++) {
      const randomBidder = bidders[Math.floor(Math.random() * bidders.length)];
      const rating = Math.floor(Math.random() * 2) + 4;

      try {
        await models.feedbacks.create({
          product_id: product.product_id,
          from_user_id: randomBidder.user_id,
          to_user_id: sellerUser.user_id,
          rating: rating,
          comment: feedbackComments[Math.floor(Math.random() * feedbackComments.length)],
        });
        feedbackCount++;
      } catch (err) {
        // Ignore duplicates
      }
    }
  }

  console.log('Creating feedbacks... OK');

  // ============================================
  // 9. SEED UPGRADE REQUESTS
  // ============================================
  let upgradeCount = 0;

  const upgradeReasons = [
    'I want to upgrade my account to Seller status to start selling items on the platform.',
    'Interested in becoming a premium seller with enhanced features.',
    'Ready to expand my business to the selling side.',
    'Would like access to seller dashboard and analytics.',
    'Requesting seller verification for my account.',
  ];

  const upgradeStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

  for (const bidder of bidders) {
    const upgradeReqCount = Math.floor(Math.random() * 2);

    for (let i = 0; i < upgradeReqCount; i++) {
      await models.upgrade_requests.create({
        user_id: bidder.user_id,
        reason: upgradeReasons[Math.floor(Math.random() * upgradeReasons.length)],
        status: upgradeStatuses[Math.floor(Math.random() * upgradeStatuses.length)],
      });
      upgradeCount++;
    }
  }

  console.log('Creating upgrade requests... OK');

  // Return summary data
  return {
    users: 6,
    categories: 5,
    products: products.length,
    descriptions: products.length,
    images: imageCount,
    bids: totalBids,
    autoBids: autoBidCount,
    watchlists: watchlistCount,
    feedbacks: feedbackCount,
    upgrades: upgradeCount,
  };
};

// Sequelize Seeder Format
export default {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting database seeding...\n');
      const summary = await seedData();

      console.log('\n========================================');
      console.log('Database seeding completed successfully!');
      console.log('========================================');
      console.log('Summary:');
      console.log(`   - Users: ${summary.users} total`);
      console.log(`   - Categories: ${summary.categories} total`);
      console.log(`   - Products: ${summary.products} total`);
      console.log(`   - Product Descriptions: ${summary.descriptions} total`);
      console.log(`   - Product Images: ${summary.images} total`);
      console.log(`   - Bids: ${summary.bids} total (7 per product)`);
      console.log(`   - Auto Bids: ${summary.autoBids} total`);
      console.log(`   - Watchlist Entries: ${summary.watchlists} total`);
      console.log(`   - Feedbacks: ${summary.feedbacks} total`);
      console.log(`   - Upgrade Requests: ${summary.upgrades} total`);
      console.log('========================================\n');

      console.log('Login Credentials:');
      console.log('   Admin: admin@auction.com / password123');
      console.log('   Seller: seller@auction.com / password123');
      console.log('   Bidders: bidder[1-4]@auction.com / password123\n');
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Reversing seed...');
      // Delete in reverse order of creation
      await queryInterface.bulkDelete('upgrade_requests', null, {});
      await queryInterface.bulkDelete('feedbacks', null, {});
      await queryInterface.bulkDelete('watchlists', null, {});
      await queryInterface.bulkDelete('product_images', null, {});
      await queryInterface.bulkDelete('auto_bids', null, {});
      await queryInterface.bulkDelete('bids', null, {});
      await queryInterface.bulkDelete('product_descriptions', null, {});
      await queryInterface.bulkDelete('products', null, {});
      await queryInterface.bulkDelete('categories', null, {});
      await queryInterface.bulkDelete('users', null, {});
      console.log('Seed reversal completed successfully!');
    } catch (error) {
      console.error('Seed reversal error:', error);
      throw error;
    }
  },
};