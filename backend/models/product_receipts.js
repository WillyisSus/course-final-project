import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_receipts extends Model {
  static init(sequelize, DataTypes) {
    return super.init({
      receipt_id: {
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
      buyer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      seller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      paid_by_buyer: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      confirmed_by_seller: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      confirmed_by_buyer: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM("PENDING","FINISHED","CANCELLED"),
        allowNull: true,
        defaultValue: "PENDING"
      },
      paypal_order:{
        type: DataTypes.STRING(255),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      sequelize,
      tableName: 'product_receipts',
      schema: 'public',
      timestamps: false, // We define created_at manually to match your schema requirements
      indexes: [
        {
          name: "product_receipts_pkey",
          unique: true,
          fields: [
            { name: "receipt_id" },
          ]
        },
        {
          name: "idx_receipts_buyer",
          fields: [
            { name: "buyer_id" },
          ]
        },
        {
          name: "idx_receipts_seller",
          fields: [
            { name: "seller_id" },
          ]
        },
      ]
    });
  }
}