const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["available", "booked", "completed", "cancelled", "no-show"],
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure doctor doesn't create overlapping slots
timeSlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model("TimeSlot", timeSlotSchema);
