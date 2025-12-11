import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class blocked_bidders extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'product_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    blocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'blocked_bidders',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "blocked_bidders_pkey",
        unique: true,
        fields: [
          { name: "product_id" },
          { name: "user_id" },
        ]
      },
    ]
  });
  }
}
