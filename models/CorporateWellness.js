const mongoose = require("mongoose");

const corporateWellnessSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  institutionType: {
    type: String,
    enum: ["School", "College", "Corporate", "NGO", "Healthcare", "Other"],
    required: true,
  },
  organizationName: { type: String, required: true },
  designation: { type: String, required: true },
  numberOfMembers: { type: Number, required: true },
  interestedServices: {
    type: String,
    enum: ["Free Session", "Yearly plans", "Not sure"],
    required: true,
  },
  notSureMessage: { type: String, default: null },
  goals: { type: String, required: true },
  estimatedBudget: {
    type: String,
    enum: [
      "₹25,000–₹45,000",
      "₹45,000–₹75,000",
      "₹75,000–₹1,00,000",
      "Flexible",
    ],
    required: true,
  },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CorporateWellness", corporateWellnessSchema);
