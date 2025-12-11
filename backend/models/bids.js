import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class bids extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    bid_id: {
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
      }
    },
    bidder_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("VALID","REJECTED","CANCELLED"),
      allowNull: true,
      defaultValue: "VALID"
    },
    time: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'bids',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "bids_pkey",
        unique: true,
        fields: [
          { name: "bid_id" },
        ]
      },
      {
        name: "idx_bids_bidder",
        fields: [
          { name: "bidder_id" },
        ]
      },
      {
        name: "idx_bids_product",
        fields: [
          { name: "product_id" },
        ]
      },
    ]
  });
  }
}
