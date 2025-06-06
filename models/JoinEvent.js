// models/JoinEvent.js
const mongoose = require("mongoose");

const joinEventSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityEvent", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventType: { type: String, required: true }, // e.g., group therapy, therapyplus, etc.
  amountPaid: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentMethod: { type: String }, // razorpay, stripe, cash, etc.
  paymentId: { type: String },     // transaction ID or reference
}, { timestamps: true });

module.exports = mongoose.model("JoinEvent", joinEventSchema);
