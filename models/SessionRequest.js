const mongoose = require("mongoose");

const sessionRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  meetingLink: { type: String, default: null },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  doctorAccept: { type: Boolean, default: null },
});

module.exports = mongoose.model("SessionRequest", sessionRequestSchema);
