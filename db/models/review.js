"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.Spot, { foreignKey: "spotId" });
      Review.belongsTo(models.User, { foreignKey: "userId" });
      Review.hasMany(models.ReviewImage, { foreignKey: "reviewId" });
    }
  }

  Review.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Spots", key: "id" },
        onDelete: "CASCADE",
      },
      review: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stars: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"), 
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"), 
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Review",
      tableName: "Reviews",
      timestamps: true, 
    }
  );

  return Review;
};
