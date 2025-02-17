const express = require("express");
const router = express.Router();

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { User } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

// Updated validation to include firstName and lastName
const validateSignup = [
  check("firstName")
    .exists({ checkFalsy: true })
    .withMessage("First name is required."),
  check("lastName")
    .exists({ checkFalsy: true })
    .withMessage("Last name is required."),
  check("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("username")
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage("Please provide a username with at least 4 characters."),
  check("username").not().isEmail().withMessage("Username cannot be an email."),
  check("password")
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters or more."),
  handleValidationErrors,
];


router.post("/", validateSignup, async (req, res, next) => {
  const { firstName, lastName, email, username, password } = req.body;

  try {
    const user = await User.signup({
      firstName,
      lastName,
      email,
      username,
      password,
    });
    await setTokenCookie(res, user);
    return res.status(201).json({
      user: user.toSafeObject(),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const errors = {};
      error.errors.forEach((e) => {
        errors[e.path] = `${e.path} must be unique`;
      });
      res.status(500).json({
        message: "User already exists with the specified email or username",
        errors,
      });
    } else {
      next(error);
    }
  }
});

module.exports = router;
