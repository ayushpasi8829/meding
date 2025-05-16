const mongoose = require("mongoose");

const userAnswerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizQuestion",
    required: true,
  },
  answer: {
    type: String,
    enum: ["Almost Always", "Often", "Sometimes", "Rarely"],
    required: true,
  },
});

module.exports = mongoose.model("UserAnswer", userAnswerSchema);
