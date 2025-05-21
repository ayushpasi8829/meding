const mongoose = require("mongoose");

const orgCampRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orgName: { type: String, required: true },
  city: { type: String, required: true },
  date: { type: Date, required: true },
  participants: { type: Number, required: true },
  contact: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OrgCampRequest", orgCampRequestSchema);
