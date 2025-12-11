import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class feedbacks extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    feedback_id: {
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
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'feedbacks',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "feedbacks_pkey",
        unique: true,
        fields: [
          { name: "feedback_id" },
        ]
      },
    ]
  });
  }
}
