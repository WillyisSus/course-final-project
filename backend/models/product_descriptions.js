import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_descriptions extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    desc_id: {
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'product_descriptions',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "product_descriptions_pkey",
        unique: true,
        fields: [
          { name: "desc_id" },
        ]
      },
    ]
  });
  }
}
