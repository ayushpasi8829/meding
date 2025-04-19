const express = require("express");
const doctorController = require("../../controller/doctor/sessionController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/session-request/get", verifyToken, isDoctor, doctorController.getDoctorSessionRequests);
router.post("/session/accept", verifyToken, isDoctor,doctorController.acceptSessionRequest);

module.exports = router;
