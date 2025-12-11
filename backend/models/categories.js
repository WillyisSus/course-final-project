import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class categories extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    category_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'category_id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'categories',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "categories_pkey",
        unique: true,
        fields: [
          { name: "category_id" },
        ]
      },
    ]
  });
  }
}
