const { check, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = {};

    validationErrors.array().forEach((error) => {
      errors[error.param] = error.msg;
    });

    const err = new Error("Bad Request");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad Request";
    return next(err);
  }
  next();
};

const validateSpot = [
  check("address").notEmpty().withMessage("Street address is required"),
  check("city").notEmpty().withMessage("City is required"),
  check("state").notEmpty().withMessage("State is required"),
  check("country").notEmpty().withMessage("Country is required"),
  check("lat")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be within -90 and 90"),
  check("lng")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be within -180 and 180"),
  check("name")
    .isLength({ min: 1, max: 50 })
    .withMessage("Name is required and must be less than 50 characters"),
  check("description").notEmpty().withMessage("Description is required"),
  check("price")
    .isFloat({ gt: 0 })
    .withMessage("Price per day must be a positive number"),
  handleValidationErrors,
];


module.exports = {
    handleValidationErrors,
  validateSpot,
};
