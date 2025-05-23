const mongoose = require("mongoose");
const validator = require("validator");

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 16, max: 120 },
  contact: { type: String, required: true },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Invalid email address"],
  },
  profession: { type: String, required: true },
  experience: { type: String },
  insights: { type: String },
  registeredAt: { type: Date, default: Date.now },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // new field
});

registrationSchema.index({ email: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
