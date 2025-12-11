import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class product_images extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    image_id: {
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
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'product_images',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "product_images_pkey",
        unique: true,
        fields: [
          { name: "image_id" },
        ]
      },
    ]
  });
  }
}
