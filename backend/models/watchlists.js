import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class watchlists extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'product_id'
      }
    }
  }, {
    sequelize,
    tableName: 'watchlists',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "watchlists_pkey",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "product_id" },
        ]
      },
    ]
  });
  }
}
