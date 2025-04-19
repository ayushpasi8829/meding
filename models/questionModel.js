const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    default: ["Yes", "No", "Maybe"],
  },
});

module.exports = mongoose.model("QuizQuestion", questionSchema);
