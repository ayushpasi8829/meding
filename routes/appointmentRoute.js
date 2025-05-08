const express = require("express");
const appointmentController = require("../controller/appointment/appointmentController");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../middleware/authMiddleware");
const router = express.Router();

router.post(
  "/createorupdate-timeslots",
  verifyToken,
  isDoctor,
  appointmentController.addOrUpdateTimeSlots
);

router.get(
  "/get-timeslot-toselectbydoctor",
  appointmentController.getThirtyMinSlotsWithBreaks
);

router.get("/get-Available-timeslots", appointmentController.getAvailableSlots);

router.post(
  "/book-appointment",
  verifyToken,
  isUser,
  appointmentController.bookAppointment
);

router.get("/get-doctors", appointmentController.getDoctorsForSlot);
module.exports = router;
