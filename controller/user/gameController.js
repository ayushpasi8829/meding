const QuizQuestion = require("../../models/questionModel");
const UserAnswer = require("../../models/gameAnswerModel");
const User = require("../../models/userModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const os = require("os");
exports.submitAnswer = async (req, res) => {
  const userId = req.user?.id;
  const { questionId, answer } = req.body;

  if (!questionId || !answer) {
    return res
      .status(400)
      .json({ success: false, message: "Question ID and answer are required" });
  }

  try {
    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    if (!question.options.includes(answer)) {
      return res.status(400).json({
        success: false,
        message: `Invalid answer. Allowed options are: ${question.options.join(
          ", "
        )}`,
      });
    }

    const existingAnswer = await UserAnswer.findOne({
      user: userId,
      question: questionId,
    });

    if (existingAnswer) {
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

    let score = 0;
    const answerPoints = {
      "Almost Always": 1,
      Often: 2,
      Sometimes: 3,
      Rarely: 4,
    };

    answers.forEach((ans) => {
      score += answerPoints[ans.answer] || 0;
    });

    const maxScore = answers.length * 4;
    const minScore = answers.length * 1;

    let interpretation = "Needs Care";
    if (score >= 24) interpretation = "Thriving";
    else if (score >= 18) interpretation = "Balanced";

    const reportsDir = path.join(__dirname, "../../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `mental_health_report_${user._id}.pdf`;
    const filePath = path.join(reportsDir, fileName);

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
    doc.text(`Interpretation: ${interpretation}`);
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

exports.getScoreSummary = async (req, res) => {
  const userId = req.user?.id;

  try {
    const answers = await UserAnswer.find({ user: userId }).populate(
      "question"
    );

    if (!answers.length) {
      return res.status(400).json({
        success: false,
        message: "No answers found",
      });
    }

    const answerPoints = {
      "Almost Always": 1,
      Often: 2,
      Sometimes: 3,
      Rarely: 4,
    };

    let totalScore = 0;
    let anxietyScore = 0;
    let stressScore = 0;
    let depressionScore = 0;

    answers.forEach((ans, index) => {
      const point = answerPoints[ans.answer] || 0;
      totalScore += point;

      if (index < 7) anxietyScore += point;
      else if (index < 14) stressScore += point;
      else depressionScore += point;
    });

    // General interpretation
    let generalMessage = "";
    if (totalScore >= 24) {
      generalMessage =
        "Thriving - You're doing really well. Keep nurturing yourself. Therapy can still deepen your self-awareness and personal growth.";
    } else if (totalScore >= 18) {
      generalMessage =
        "Balanced - You're managing most things with grace. Therapy can support you in staying aligned and growing.";
    } else {
      generalMessage =
        "Needs Care - You might be feeling a little off lately, and that's okay. Therapy can offer a compassionate space to reflect, heal, and reset.";
    }

    // Helper to interpret each category
    const interpret = (score) => {
      if (score >= 24) return "High";
      if (score >= 18) return "Moderate";
      return "Low";
    };

    res.status(200).json({
      success: true,
      totalScore,
      message: generalMessage,
      details: {
        anxiety: {
          score: anxietyScore,
          level: interpret(anxietyScore),
        },
        stress: {
          score: stressScore,
          level: interpret(stressScore),
        },
        depression: {
          score: depressionScore,
          level: interpret(depressionScore),
        },
      },
    });
  } catch (err) {
    console.error("Score Summary Error:", err);
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

// Load images from the "public" folder (if needed)
const getBase64Image = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    const imageBuffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.error(`Error loading image: ${filePath}`, error);
    return null;
  }
};

exports.generatePdf = async (req, res) => {
  const url = `http://localhost:5173/report`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for 1 second to ensure dynamic content loads (use setTimeout if waitForTimeout not available)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const tempFilePath = path.join(os.tmpdir(), `report-${Date.now()}.pdf`);

    await page.pdf({
      path: tempFilePath,
      format: "A4",
      printBackground: true,
      margin: { top: "0px", bottom: "0px", left: "0px", right: "0px" },
    });

    await browser.close();

    const pdfBuffer = fs.readFileSync(tempFilePath);
    fs.unlinkSync(tempFilePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${"report"}.pdf`
    );
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Error generating PDF" });
  }
};
