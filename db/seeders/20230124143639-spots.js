"use strict";

/** @type {import('sequelize-cli').Migration} */
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; 
}
options.tableName = "Spots"; 

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(options, [
      {
        ownerId: 1, 
        address: "123 Disney Lane",
        city: "San Francisco",
        state: "California",
        country: "United States of America",
        lat: 37.7645358,
        lng: -122.4730327,
        name: "App Academy",
        description: "Place where web developers are created",
        price: 123,
        avgRating: 4.5,
        previewImage: "image url", // Example placeholder image URL
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ownerId: 2,
        address: "456 Example St",
        city: "Los Angeles",
        state: "California",
        country: "United States of America",
        lat: 34.052235,
        lng: -118.243683,
        name: "Example Spot",
        description: "A great place to visit",
        price: 200,
        avgRating: 4.0,
        previewImage: "image url 2", // Example placeholder image URL
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ownerId: 3,
        address: "789 Sample Ave",
        city: "New York",
        state: "New York",
        country: "United States of America",
        lat: 40.712776,
        lng: -74.005974,
        name: "Sample Spot",
        description: "A nice spot to relax",
        price: 150,
        avgRating: 4.8,
        previewImage: "image url 3", // Example placeholder image URL
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(options, null, {});
  },
};
