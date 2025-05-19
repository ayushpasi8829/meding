const QuizQuestion = require("../../models/questionModel");
const UserAnswer = require("../../models/gameAnswerModel");
const User = require("../../models/userModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.submitAnswer = async (req, res) => {
  const userId = req.user?.id;
  const { questionId, answer } = req.body;

  if (!questionId || !answer) {
    return res
      .status(400)
      .json({ success: false, message: "Question ID and answer are required" });
  }

  if (!["Almost Always", "Often", "Sometimes", "Rarely"].includes(answer)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid answer selected" });
  }

  try {
    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    const existingAnswer = await UserAnswer.findOne({
      user: userId,
      question: questionId,
    });

    if (existingAnswer) {
      // Update existing answer
      existingAnswer.answer = answer;
      await existingAnswer.save();
      return res.status(200).json({
        success: true,
        message: "Answer updated successfully",
        data: existingAnswer,
      });
    }

    const newAnswer = new UserAnswer({
      user: userId,
      question: questionId,
      answer,
    });

    await newAnswer.save();

    res.status(201).json({
      success: true,
      message: "Answer submitted successfully",
      data: newAnswer,
    });
  } catch (err) {
    console.error("Submit Answer Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.generatePdfReport = async (req, res) => {
  const userId = req.user?.id;

  try {
    const user = await User.findById(userId);
    const answers = await UserAnswer.find({ user: userId }).populate(
      "question"
    );

    if (!answers.length) {
      return res
        .status(400)
        .json({ success: false, message: "No answers found" });
    }

    // 🔍 Basic Scoring
    let score = 0;
    answers.forEach((ans) => {
      if (ans.answer === "Yes") score += 2;
      else if (ans.answer === "Maybe") score += 1;
      // No = 0
    });

    const maxScore = answers.length * 2;
    const percentage = (score / maxScore) * 100;

    let stressLevel = "Low";
    if (percentage > 70) stressLevel = "High";
    else if (percentage > 40) stressLevel = "Medium";

    const reportsDir = path.join(__dirname, "../../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `mental_health_report_${user._id}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // 📄 Create PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Mental Health Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Name: ${user.fullname}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(16).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Total Questions: ${answers.length}`);
    doc.text(`Score: ${score} / ${maxScore}`);
    doc.text(`Stress Level: ${stressLevel}`);
    doc.text(`Mental Health %: ${percentage.toFixed(2)}%`);
    doc.moveDown();

    doc.fontSize(16).text("Question-wise Summary", { underline: true });
    answers.forEach((ans, index) => {
      doc.fontSize(12).text(`${index + 1}. ${ans.question.question}`);
      doc
        .font("Helvetica-Bold")
        .text(`→ Your Answer: ${ans.answer}`, { indent: 20 });
      doc.moveDown(0.5);
    });

    doc.end();

    stream.on("finish", () => {
      res.status(200).json({
        success: true,
        message: "Report generated successfully",
        url: `/reports/${fileName}`,
      });
    });
  } catch (err) {
    console.error("PDF Report Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const questions = await QuizQuestion.find();
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message,
    });
  }
};
