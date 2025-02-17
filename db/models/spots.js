"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
      Spot.belongsTo(models.User, { foreignKey: "ownerId", as: "Owner" });
      Spot.hasMany(models.SpotImage, {
        foreignKey: "spotId",
        as: "SpotImages",
      });

    }
  }
  Spot.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      address: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      country: DataTypes.STRING,
      lat: DataTypes.FLOAT,
      lng: DataTypes.FLOAT,
      description: DataTypes.STRING,
      price: DataTypes.DECIMAL,
      avgRating: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
      },
      previewImage: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Spot",
      tableName: "Spots", 
    }
  );

  return Spot;
};
