const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    enum: ["Almost Always", "Often", "Sometimes", "Rarely"],
    default: ["Almost Always", "Often", "Sometimes", "Rarely"],
  },
});

module.exports = mongoose.model("QuizQuestion", questionSchema);
