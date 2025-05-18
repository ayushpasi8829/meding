const express = require("express");
const bundleController = require("../../controller/user/bundleController");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/select-bundle", verifyToken, isUser, bundleController.selectBundle);

module.exports = router;
