"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class SpotImage extends Model {
    static associate(models) {
      // Define associations here
      SpotImage.belongsTo(models.Spot, {
        foreignKey: "spotId",
        as: "spot",
      });
    }
  }

  SpotImage.init(
    {
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      preview: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Spots", 
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      modelName: "SpotImage",
      tableName: "SpotImages",
    }
  );

  return SpotImage;
};
