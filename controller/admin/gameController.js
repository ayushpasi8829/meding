const QuizQuestion = require("../../models/questionModel");


exports.addQuestion = async (req, res) => {
    const { question } = req.body;
  
    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required" });
    }
  
    try {
      const newQuestion = new QuizQuestion({ question });
      await newQuestion.save();
  
      res.status(201).json({
        success: true,
        message: "Question added successfully",
        data: newQuestion,
      });
    } catch (err) {
      console.error("Add Question Error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };