const express = require("express");
const authController = require("../controller/authController");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/registration", verifyToken, authController.completeRegistration);

router.post("/doctor/register", authController.doctorSignup);

router.post("/login", authController.login);

module.exports = router;
