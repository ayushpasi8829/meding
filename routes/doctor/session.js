const express = require("express");
const doctorController = require("../../controller/doctor/sessionController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/session-request/get", verifyToken, isDoctor, doctorController.getDoctorSessionRequests);
router.post("/session/accept", verifyToken, isDoctor,doctorController.acceptSessionRequest);
router.post("/session/cancel", verifyToken, isDoctor,doctorController.cancelAppointment);


router.post("/session/notes", verifyToken, isDoctor,doctorController.addNotesToAppointment);

router.get("/today-appointments", verifyToken, isDoctor, doctorController.getTodayAppointments);
router.get("/upcoming-appointments", verifyToken, isDoctor, doctorController.getUpcomingAppointments);
module.exports = router;
