import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _auto_bids from  "./auto_bids.js";
import _bids from  "./bids.js";
import _blocked_bidders from  "./blocked_bidders.js";
import _categories from  "./categories.js";
import _feedbacks from  "./feedbacks.js";
import _product_descriptions from  "./product_descriptions.js";
import _product_images from  "./product_images.js";
import _products from  "./products.js";
import _upgrade_requests from  "./upgrade_requests.js";
import _users from  "./users.js";
import _watchlists from  "./watchlists.js";

export default function initModels(sequelize) {
  const auto_bids = _auto_bids.init(sequelize, DataTypes);
  const bids = _bids.init(sequelize, DataTypes);
  const blocked_bidders = _blocked_bidders.init(sequelize, DataTypes);
  const categories = _categories.init(sequelize, DataTypes);
  const feedbacks = _feedbacks.init(sequelize, DataTypes);
  const product_descriptions = _product_descriptions.init(sequelize, DataTypes);
  const product_images = _product_images.init(sequelize, DataTypes);
  const products = _products.init(sequelize, DataTypes);
  const upgrade_requests = _upgrade_requests.init(sequelize, DataTypes);
  const users = _users.init(sequelize, DataTypes);
  const watchlists = _watchlists.init(sequelize, DataTypes);

  products.belongsToMany(users, { as: 'user_id_users', through: blocked_bidders, foreignKey: "product_id", otherKey: "user_id" });
  products.belongsToMany(users, { as: 'user_id_users_watchlists', through: watchlists, foreignKey: "product_id", otherKey: "user_id" });
  users.belongsToMany(products, { as: 'product_id_products', through: blocked_bidders, foreignKey: "user_id", otherKey: "product_id" });
  users.belongsToMany(products, { as: 'product_id_products_watchlists', through: watchlists, foreignKey: "user_id", otherKey: "product_id" });
  categories.belongsTo(categories, { as: "parent", foreignKey: "parent_id"});
  categories.hasMany(categories, { as: "sub_categories", foreignKey: "parent_id"});
  products.belongsTo(categories, { as: "category", foreignKey: "category_id"});
  categories.hasMany(products, { as: "products", foreignKey: "category_id"});
  auto_bids.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(auto_bids, { as: "auto_bids", foreignKey: "product_id"});
  bids.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(bids, { as: "bids", foreignKey: "product_id"});
  blocked_bidders.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(blocked_bidders, { as: "blocked_bidders", foreignKey: "product_id"});
  feedbacks.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(feedbacks, { as: "feedbacks", foreignKey: "product_id"});
  product_descriptions.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(product_descriptions, { as: "product_descriptions", foreignKey: "product_id"});
  product_images.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(product_images, { as: "product_images", foreignKey: "product_id"});
  watchlists.belongsTo(products, { as: "product", foreignKey: "product_id"});
  products.hasMany(watchlists, { as: "watchlists", foreignKey: "product_id"});
  auto_bids.belongsTo(users, { as: "bidder", foreignKey: "bidder_id"});
  users.hasMany(auto_bids, { as: "auto_bids", foreignKey: "bidder_id"});
  bids.belongsTo(users, { as: "bidder", foreignKey: "bidder_id"});
  users.hasMany(bids, { as: "bids", foreignKey: "bidder_id"});
  blocked_bidders.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(blocked_bidders, { as: "blocked_bidders", foreignKey: "user_id"});
  feedbacks.belongsTo(users, { as: "from_user", foreignKey: "from_user_id"});
  users.hasMany(feedbacks, { as: "feedbacks", foreignKey: "from_user_id"});
  feedbacks.belongsTo(users, { as: "to_user", foreignKey: "to_user_id"});
  users.hasMany(feedbacks, { as: "to_user_feedbacks", foreignKey: "to_user_id"});
  products.belongsTo(users, { as: "seller", foreignKey: "seller_id"});
  users.hasMany(products, { as: "products", foreignKey: "seller_id"});
  products.belongsTo(users, { as: "winner", foreignKey: "winner_id"});
  users.hasMany(products, { as: "winner_products", foreignKey: "winner_id"});
  upgrade_requests.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(upgrade_requests, { as: "upgrade_requests", foreignKey: "user_id"});
  watchlists.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(watchlists, { as: "watchlists", foreignKey: "user_id"});

  return {
    auto_bids,
    bids,
    blocked_bidders,
    categories,
    feedbacks,
    product_descriptions,
    product_images,
    products,
    upgrade_requests,
    users,
    watchlists,
  };
}
