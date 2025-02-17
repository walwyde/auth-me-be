const express = require("express");
const { Op } = require("sequelize");
const { Review, ReviewImage, SpotImage, Spot } = require("../../db/models");

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// delete a spot image
router.delete("/spot-images/:imageId", requireAuth, async (req, res) => {
  const image = await SpotImage.findByPk(req.params.imageId);

  if (!image) {
    return res.status(404).json({ message: "Spot Image couldn't be found" });
  }

  const spot = await Spot.findByPk(image.spotId);
  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await image.destroy();
  return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;