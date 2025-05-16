const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentOrProfessional: {
    type: String,
    enum: ["Student", "Professional"],
    required: true,
  },
  collegeName: { type: String, required: true },
  internshipLevel: {
    type: String,
    enum: ["Level 1", "Level 2", "Level 3"],
    required: true,
  },
  whyChooseYou: { type: String, required: true },
  heardFrom: { type: String, required: true },
  heardFromOther: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Internship", internshipSchema);
