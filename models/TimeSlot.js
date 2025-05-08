const mongoose = require("mongoose");

// Slot schema: each slot has a start and end time in 24-hour format
const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      // Validates "HH:mm" 24-hour format
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
  },
  { _id: false }
);

const doctorTimeSlotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    // Optionally, you can restrict to users with role: "doctor" in your logic
  },
  slots: {
    type: [slotSchema],
    required: true,
    validate: [(slots) => slots.length > 0, "At least one slot is required"],
  },
});

module.exports = mongoose.model("DoctorTimeSlot", doctorTimeSlotSchema);
