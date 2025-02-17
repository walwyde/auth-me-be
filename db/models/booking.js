"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // Associate Booking with User
      Booking.belongsTo(models.User, { foreignKey: "userId" });

      // Associate Booking with Spot
      Booking.belongsTo(models.Spot, { foreignKey: "spotId" });
    }
  }
  Booking.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATEONLY, 
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATEONLY, 
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Booking",
      tableName: "Bookings", 
    }
  );
  return Booking;
};
