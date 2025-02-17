const express = require("express");
const { setTokenCookie, restoreUser } = require("../../utils/auth");
const { User } = require("../../db/models");
const router = express.Router();
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

// Validation for user login
const validateLogin = [
  check("credential")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Please provide a valid email or username."),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a password."),
  handleValidationErrors,
];

// Login user
router.post("/", validateLogin, async (req, res, next) => {
  const { credential, password } = req.body;

  console.log("Attempting login for:", credential);
  const user = await User.login({ credential, password });
  console.log("User found:", user);
  // Check if login was unsuccessful
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401; // Unauthorized
    err.title = "Invalid credentials";
    err.errors = ["The provided credentials were invalid."];
    return next(err);
  }

  // Set token cookie on successful login
  await setTokenCookie(res, user);

  return res.json({
    user: user.toSafeObject(), 
  });
});

// Logout user
router.delete("/", (_req, res) => {
  res.clearCookie("token"); // Clear the token cookie on logout
  return res.json({ message: "success" });
});

// Get the current user
router.get("/", restoreUser, (req, res) => {
  const { user } = req;
  // Return user information if authenticated
  if (user) {
    return res.json({
      user: user.toSafeObject(),    });
  } else {
    return res.json({ user: null }); // No user logged in
  }
});


module.exports = router;
