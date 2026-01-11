import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class auto_bids extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    auto_bid_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'product_id'
      },
      unique: "auto_bids_product_id_bidder_id_key"
    },
    bidder_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      unique: "auto_bids_product_id_bidder_id_key"
    },
    max_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    }, 
    created_at:{
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }, updated_at:{
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'auto_bids',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "auto_bids_pkey",
        unique: true,
        fields: [
          { name: "auto_bid_id" },
        ]
      },
      {
        name: "auto_bids_product_id_bidder_id_key",
        unique: true,
        fields: [
          { name: "product_id" },
          { name: "bidder_id" },
        ]
      },
    ]
  });
  }
}
