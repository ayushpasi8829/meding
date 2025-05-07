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
  "/create-timeslots",
  verifyToken,
  isDoctor,
  appointmentController.createTimeSlots
);

router.get("/get-timeslot-toselect", appointmentController.getDummyTimeSlots);

router.get(
  "/get-Available-timeslots",
  appointmentController.getAvailableUniqueSlots
);

router.post(
  "/book-appointment",
  verifyToken,
  isUser,
  appointmentController.bookAppointment
);
module.exports = router;
