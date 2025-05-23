const mongoose = require("mongoose");
const validator = require("validator");

const proposalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Invalid email address"],
  },
  background: { type: String, required: true },
  bio: { type: String, required: true },
  topic: { type: String, required: true },
  hasExperience: { type: Boolean, required: true },
  audience: {
    type: String,
    required: true,
    enum: ["Students", "Interns", "Early-career professionals", "Open to all"],
  },
  mode: { type: String, required: true, enum: ["Online", "Offline"] },
  preferredDates: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // new field
});

module.exports = mongoose.model("Proposal", proposalSchema);
