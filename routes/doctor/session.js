const express = require("express");
const doctorController = require("../../controller/doctor/sessionController");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/appointments",
  verifyToken,
  isDoctor,
  doctorController.getAllDoctorAppointments
);

router.get(
  "/session-request/get",
  verifyToken,
  isDoctor,
  doctorController.getDoctorSessionRequests
);
router.post(
  "/session/accept",
  verifyToken,
  isDoctor,
  doctorController.acceptSessionRequest
);
router.post(
  "/session/cancel",
  verifyToken,
  isDoctor,
  doctorController.cancelAppointment
);

router.post(
  "/session/compelte",
  verifyToken,
  isDoctor,
  doctorController.completeAppointment
);

router.post(
  "/session/notes",
  verifyToken,
  isDoctor,
  doctorController.addNotesToAppointment
);

router.get(
  "/today-appointments",
  verifyToken,
  isDoctor,
  doctorController.getTodayAppointments
);
router.get(
  "/upcoming-appointments",
  verifyToken,
  isDoctor,
  doctorController.getUpcomingAppointments
);

router.get(
  "/session/stats",
  verifyToken,
  isDoctor,
  doctorController.getDoctorSessionStats
);
router.get(
  "/get-doctors-selected-slots",
  verifyToken,
  isDoctor,
  doctorController.getDoctorsSelectedSlots
);

router.get(
  "/session/stats",
  verifyToken,
  isDoctor,
  doctorController.getDoctorSessionStats
);

router.post(
  "/completed-appointments",
  verifyToken,
  isDoctor,
  doctorController.completeAppointment
);
module.exports = router;
