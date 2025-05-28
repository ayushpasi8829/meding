const mongoose = require("mongoose");

const GroupTherapyRegistrationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupTherapySession",
    required: true,
  },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  profession: { type: String, required: true },
  specific: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "GroupTherapyRegistration",
  GroupTherapyRegistrationSchema
);
