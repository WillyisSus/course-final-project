import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class products extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    product_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'category_id'
      }
    },
    winner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    price_start: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    price_step: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    price_buy_now: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    price_current: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_auto_extend: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM("ACTIVE","SOLD","EXPIRED"),
      allowNull: true,
      defaultValue: "ACTIVE"
    },
    tsv: {
      type: "TSVECTOR",
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'products',
    schema: 'public',
    hasTrigger: true,
    timestamps: true,
    indexes: [
      {
        name: "idx_products_category",
        fields: [
          { name: "category_id" },
        ]
      },
      {
        name: "idx_products_end_date",
        fields: [
          { name: "end_date" },
        ]
      },
      {
        name: "idx_products_price",
        fields: [
          { name: "price_current" },
        ]
      },
      {
        name: "idx_products_seller",
        fields: [
          { name: "seller_id" },
        ]
      },
      {
        name: "idx_products_tsv",
        fields: [
          { name: "tsv" },
        ]
      },
      {
        name: "products_pkey",
        unique: true,
        fields: [
          { name: "product_id" },
        ]
      },
    ]
  });
  }
}
