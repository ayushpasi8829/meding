const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  speaker: { type: String, required: true },
  dateTime: { type: Date, required: true },
  mode: { type: String, required: true, enum: ["Online", "Offline"] },
  fee: { type: Number, required: true },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional
});

module.exports = mongoose.model("Session", sessionSchema);
