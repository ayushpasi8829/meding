const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema({
  amount: Number,
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  dueSessionNumber: Number, 
  paidAt: Date,
});

const bundleSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bundleType: {
    type: String, // e.g., "3-sessions", "5-sessions", "custom"
    required: true,
  },
  totalSessions: {
    type: Number,
    required: true,
  },
  usedSessions: {
    type: Number,
    default: 0,
  },
  paymentPlan: {
    totalAmount: Number,
    paidAmount: {
      type: Number,
      default: 0,
    },
    installments: [installmentSchema],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BundleSession", bundleSessionSchema);
