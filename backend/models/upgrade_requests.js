import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class upgrade_requests extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    request_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("PENDING","APPROVED","REJECTED"),
      allowNull: true,
      defaultValue: "PENDING"
    }
  }, {
    sequelize,
    tableName: 'upgrade_requests',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "upgrade_requests_pkey",
        unique: true,
        fields: [
          { name: "request_id" },
        ]
      },
    ]
  });
  }
}
