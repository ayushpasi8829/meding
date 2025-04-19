const mongoose = require("mongoose");

const userSelectedPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserSelectedPlan", userSelectedPlanSchema);
