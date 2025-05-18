const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String },
  email: { type: String, unique: true },
  mobile: { type: String, required: true, unique: true },
  countryCode: { type: String, required: true },
  role: { type: String, enum: ["doctor", "admin", "user"], required: true },
  location: { type: String },
  reason: {
    type: String,
    enum: [
      "Therapy",
      "Psychometric Assessment",
      "Corporate Wellness",
      "Community Initiatives",
      "Internships",
      "Not Sure",
    ],
    // required: true
  },

  availability: {
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
  },
  firstTherapyStatus: {
    type: String,
    enum: ["pending", "done"],
    default: null,
  },
  selectedPlan: { type: String, default: null },
  otp: { type: String, required: false },
  otpExpiresAt: { type: Date, required: false },
  isMobileVerified: { type: Boolean, default: false },
  therapy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapy",
    default: null,
  },
  hasSelectedBundle: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
