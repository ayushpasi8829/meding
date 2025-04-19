const express = require("express");
const authController = require("../controller/authController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.signup);

router.post("/doctor/register", authController.doctorSignup);

router.post("/login", authController.login);

module.exports = router;
