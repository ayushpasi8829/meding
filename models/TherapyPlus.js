const mongoose = require("mongoose");

const therapyPlusJoinSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String, required: true },
  age: { type: Number, required: true },
  profession: { type: String, required: true },
  whatsappLink: { type: String, required: true }, // Store WhatsApp link here
  createdAt: { type: Date, default: Date.now },
});

const therapyPlusHostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  profession: { type: String, required: true },
  sessionType: { type: String, required: true },
  sessionDetails: { type: String, required: true },
  preferredDate: { type: String, required: true },
  experience: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const TherapyPlusJoin = mongoose.model(
  "TherapyPlusJoin",
  therapyPlusJoinSchema
);
const TherapyPlusHost = mongoose.model(
  "TherapyPlusHost",
  therapyPlusHostSchema
);

module.exports = { TherapyPlusJoin, TherapyPlusHost };
