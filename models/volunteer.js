const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  city: { type: String, required: true },
  college: { type: String, required: true },
  education: { type: String, required: true },
  why: { type: String, required: true },
  whatsappGroupLink: { type: String, required: false }, // New field
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Volunteer", volunteerSchema);
