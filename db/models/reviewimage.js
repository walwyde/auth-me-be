"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReviewImage extends Model {
    static associate(models) {
      // Association with the Review model
      ReviewImage.belongsTo(models.Review, {
        foreignKey: "reviewId",
        as: "ReviewImages",
      }); 
    }
  }

  ReviewImage.init(
    {
      reviewId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Reviews", 
          key: "id",
        },
        onDelete: "CASCADE", 
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ReviewImage",
      tableName: "ReviewImages", 
    }
  );

  return ReviewImage;
};
