const mongoose = require("mongoose");

const NotSureSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  concerns: { type: String, required: true, maxlength: 500 },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // e.g., "9:15 AM"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("NotSure", NotSureSchema);
