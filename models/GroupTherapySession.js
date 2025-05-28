const mongoose = require("mongoose");

const GroupTherapySessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  therapist: {
    name: { type: String, required: true },
    experience: { type: String, required: true },
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  mode: { type: String, required: true },
  fee: { type: Number, required: true },
  topics: [{ type: String }],
  zoomLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "GroupTherapySession",
  GroupTherapySessionSchema
);
