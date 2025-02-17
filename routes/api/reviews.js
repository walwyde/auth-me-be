const express = require("express");
const { Op } = require("sequelize");
const { Spot, User, Review, ReviewImage } = require("../../db/models");
const { setTokenCookie, restoreUser } = require("../../utils/auth");
const { validateSpot } = require("../../utils/validation");
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Edit/Update a Review
router.put("/:reviewId", requireAuth, async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { review: updatedReview, stars } = req.body;

  if (!updatedReview || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        review: "Review text is required",
        stars: "Stars must be an integer from 1 to 5",
      },
    });
  }

  review.review = updatedReview;
  review.stars = stars;

  await review.save();

  return res.json(review);
});

// Delete a Review
router.delete("/:reviewId", requireAuth, async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await review.destroy();

  return res.json({ message: "Successfully deleted" });
});


// Get all reviews by the current user
router.get("/current", requireAuth, async (req, res) => {
  console.log(req.user);
  const reviews = await Review.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"], // Include User details
      },
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "lat",
          "lng",
          "name",
          "price",
          "previewImage",
        ],
      },
      {
        model: ReviewImage,
        as: "ReviewImages",
        attributes: ["id", "url"],
      },
    ],
  });

  return res.status(200).json({ Reviews: reviews });
});

// GET a Specific Review

router.get("/:reviewId", async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId, {
    include: [{ model: User }, { model: ReviewImage }],
  });

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  return res.json(review);
});

// Add an Image to a Review based on review id

router.post("/:reviewId/images", requireAuth, async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const reviewImagesCount = await ReviewImage.count({
    where: { reviewId: review.id },
  });
  if (reviewImagesCount >= 10) {
    return res.status(403).json({
      message: "Maximum number of images for this resource was reached",
    });
  }

  const { url } = req.body;
  const newImage = await ReviewImage.create({ reviewId: review.id, url });

  return res.status(201).json(newImage);
});

module.exports = router;
