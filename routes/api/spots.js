const express = require("express");
const { Op } = require("sequelize");
const {
  Spot,
  User,
  SpotImage,
  Review,
  ReviewImage,
  Booking,
} = require("../../db/models");
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


// add query filter to get all spots
router.get("/", async (req, res) => {
  try {
    // Set default pagination values

    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);

    // Parse query parameters
    const minLat = parseFloat(req.query.minLat);
    const maxLat = parseFloat(req.query.maxLat);
    const minLng = parseFloat(req.query.minLng);
    const maxLng = parseFloat(req.query.maxLng);
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    console.log(minLat, minLng);

    // Initialize error collection
    const errors = {};

    // Validate pagination
    if ((req.query.page !== undefined && isNaN(page)) || page < 1)
      errors.page = "must be a positive integer";
    if ((req.query.page !== undefined && isNaN(size)) || size < 1)
      errors.size = "must be a positive integer";

    // Validate lat/lng and price parameters
    if (req.query.minLat !== undefined && isNaN(minLat))
      errors.minLat = "must be a number";
    if (req.query.maxLat !== undefined && isNaN(maxLat))
      errors.maxLat = "must be a number";
    if (req.query.minLng !== undefined && isNaN(minLng))
      errors.minLng = "must be a number";
    if (req.query.maxLng !== undefined && isNaN(maxLng))
      errors.maxLng = "must be a number";
    if (req.query.minPrice !== undefined && isNaN(minPrice))
      errors.minPrice = "must be a number";
    if (req.query.maxPrice !== undefined && isNaN(maxPrice))
      errors.maxPrice = "must be a number";

    const errorsObject = Object.keys(errors);

    const checkSize = req.query.minLat !== undefined && errors.length > 0;

    const checkPage = req.query.size !== undefined && errorsObject.length > 0;

    const checkMinLat =
      req.query.minLat !== undefined && errorsObject.length > 0;

    const checkMinLng =
      req.query.minLng !== undefined && errorsObject.length > 0;

    // Return 400 if there are validation errors
    if (checkSize || checkPage || checkMinLat || checkMinLng) {
      return res.status(400).json({
        message: "Invalid query parameters.",
        errors,
      });
    }

    // Apply filters for querying spots
    const where = {};
    if (req.query.minLat || req.query.maxLat) {
      where.lat = {
        ...(req.query.minLat && { [Op.gte]: minLat }),
        ...(req.query.maxLat && { [Op.lte]: maxLat }),
      };
    }
    if (req.query.minLng || req.query.maxLng) {
      where.lng = {
        ...(req.query.minLng && { [Op.gte]: minLng }),
        ...(req.query.maxLng && { [Op.lte]: maxLng }),
      };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      where.price = {
        ...(req.query.minPrice && { [Op.gte]: minPrice }),
        ...(req.query.maxPrice && { [Op.lte]: maxPrice }),
      };
    }

    // Fetch spots with pagination and filtering

    if (page && !isNaN(page) && size && !isNaN(size)) {
      const spots = await Spot.findAll({
        where,
        page,
        size,
        limit: size,
        offset: (page - 1) * size,
      });

      // Return response with paginated data
      return res.json({
        page,
        size,
        where,
        Spots: spots,
      });
    }

    const spots = await Spot.findAll({});

    res
      .status(200)
      .json({ Spots: spots, page: page ? page : 1, size: size ? size : 20 });
  } catch (err) {
    res.status(500).json({
      message: "An unexpected error occurred",
      error: err.message,
    });
  }
});

// Get all Spots owned by the Current User
router.get("/current", requireAuth, async (req, res) => {
  const spots = await Spot.findAll({
    where: {
      ownerId: req.user.id,
    },
  });
  return res.json({ Spots: spots });
});

// Get details of  a spot from an id

router.get("/:spotId", async (req, res) => {
  const spot = await Spot.findOne({
    where: { id: req.params.spotId },
    include: [
      {
        model: User,
        as: "Owner",
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: SpotImage,
        as: "SpotImages",
        attributes: ["id", "url", "preview"],
      },
    ],
  });

  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found",
      statusCode: 404,
    });
  }

  const spotData = {
    ...spot.toJSON(),
    avgStarRating: spot.avgRating || 0,
    numReviews: spot.numReviews || 0,
  };

  return res.status(200).json(spotData);
});

// Create a Spot
router.post("/", requireAuth, validateSpot, async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;

    const newSpot = await Spot.create({
      ownerId: req.user.id,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    return res.status(201).json(newSpot);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Bad Request",
        errors: error.errors.reduce((acc, err) => {
          acc[err.path] = err.message;
          return acc;
        }, {}),
      });
    }
    next(error);
  }
});

// Add an Image to a Spot based on the Spot's id
router.post("/:id/images", requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.id);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { url, preview } = req.body;
  const newImage = await SpotImage.create({
    spotId: spot.id,
    url,
    preview,
  });

  return res.status(201).json(newImage);
});

// Edit a Spot
router.put("/:spotId", requireAuth, validateSpot, async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  await spot.update({
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  return res.status(200).json(spot);
});

// Delete a Spot
router.delete("/:id", requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.id);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await spot.destroy();

  return res.json({ message: "Successfully deleted" });
});

// REVIEWS
// Get all Reviews by a Specific Spot

router.get("/:spotId/reviews", async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId); // Assuming you have a Spot model
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const reviews = await Review.findAll({
    where: { spotId: req.params.spotId },
    include: [{ model: User }, { model: ReviewImage }],
  });

  return res.json({ Reviews: reviews });
});

// Create a Review for a Spot based on the Spot's id
router.post("/:spotId/reviews", requireAuth, async (req, res) => {
  const { review, stars } = req.body;

  // Validate request body
  if (!review || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        review: "Review text is required",
        stars: "Stars must be an integer from 1 to 5",
      },
    });
  }

  // Check if the spot exists
  const spot = await Spot.findByPk(req.params.spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  // Check if the user has already reviewed this spot
  const existingReview = await Review.findOne({
    where: {
      userId: req.user.id,
      spotId: spot.id,
    },
  });
  if (existingReview) {
    return res
      .status(500)
      .json({ message: "User already has a review for this spot" });
  }

  // Create a new review
  const newReview = await Review.create({
    userId: req.user.id,
    spotId: spot.id,
    review,
    stars,
  });

  return res.status(201).json(newReview);
});

// BOOKINGS

// Get all of the Current User's Bookings
router.get("/bookings/current", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.findAll({
    where: { userId },
    include: {
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
  });

  return res.status(200).json({ Bookings: bookings });
});

// Get all Bookings for a Spot based on the Spot's ID
router.get("/spots/:spotId/bookings", requireAuth, async (req, res) => {
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const bookings = await Booking.findAll({
    where: { spotId: spot.id },
    include:
      req.user.id === spot.ownerId
        ? {
            model: User,
            attributes: ["id", "firstName", "lastName"],
          }
        : null,
  });

  return res.status(200).json({ Bookings: bookings });
});

// Create a Booking from a Spot based on the Spot's ID
router.post("/spots/:spotId/bookings", requireAuth, async (req, res) => {
  const { startDate, endDate } = req.body;
  const spot = await Spot.findByPk(req.params.spotId);

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId === req.user.id) {
    return res.status(403).json({ message: "You cannot book your own spot" });
  }

  if (
    new Date(startDate) < new Date() ||
    new Date(endDate) <= new Date(startDate)
  ) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        startDate: "startDate cannot be in the past",
        endDate: "endDate cannot be on or before startDate",
      },
    });
  }

  // Check for booking conflicts
  const existingBookings = await Booking.findAll({
    where: {
      spotId: spot.id,
      [Op.or]: [
        {
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate },
        },
      ],
    },
  });

  if (existingBookings.length > 0) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
        endDate: "End date conflicts with an existing booking",
      },
    });
  }

  const newBooking = await Booking.create({
    userId: req.user.id,
    spotId: spot.id,
    startDate,
    endDate,
  });

  return res.status(201).json(newBooking);
});
// Edit a Booking

router.put("/bookings/:bookingId", requireAuth, async (req, res) => {
  const { startDate, endDate } = req.body;
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }

  if (booking.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (
    new Date(startDate) < new Date() ||
    new Date(endDate) <= new Date(startDate)
  ) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        startDate: "startDate cannot be in the past",
        endDate: "endDate cannot be on or before startDate",
      },
    });
  }

  // Check for booking conflicts
  const conflictingBookings = await Booking.findAll({
    where: {
      spotId: booking.spotId,
      id: { [Op.ne]: booking.id },
      [Op.or]: [
        {
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    return res.status(403).json({
      message: "Sorry, this spot is already booked for the specified dates",
      errors: {
        startDate: "Start date conflicts with an existing booking",
        endDate: "End date conflicts with an existing booking",
      },
    });
  }

  booking.startDate = startDate;
  booking.endDate = endDate;
  await booking.save();

  return res.status(200).json(booking);
});

// Delete a Booking

router.delete("/bookings/:bookingId", requireAuth, async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    return res.status(404).json({ message: "Booking couldn't be found" });
  }

  if (booking.userId !== req.user.id && booking.Spot.ownerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (new Date(booking.startDate) <= new Date()) {
    return res
      .status(403)
      .json({ message: "Bookings that have been started can't be deleted" });
  }

  await booking.destroy();
  return res.status(200).json({ message: "Successfully deleted" });
});

module.exports = router;
