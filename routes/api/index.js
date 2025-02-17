const router = require("express").Router();
const sessionRouter = require("./session.js");
const usersRouter = require("./users.js");
const spotsRouter = require("./spots.js");
const reviewsRouter = require("./reviews.js");
const delReviewImageRouter = require("./del-review-image.js")
const delSpotImageRouter = require("./del-spot-image.js")
const { restoreUser } = require("../../utils/auth.js");

router.use(restoreUser);

router.use("/session", sessionRouter);

router.use("/users", usersRouter);

router.use("/spots", spotsRouter);
router.use("/reviews", reviewsRouter);
router.use('/', delReviewImageRouter)
router.use('/', delSpotImageRouter)
router.post("/test", function (req, res) {
  res.json({ requestBody: req.body });
});
router.get("/test", function (req, res) {
  res.json("hello");
});

module.exports = router;
