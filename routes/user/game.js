const express = require("express");
const doctorController = require("../../controller/user/gameController");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/answer", verifyToken, doctorController.submitAnswer);

router.get("/summary", verifyToken, doctorController.getScoreSummary);

router.get("/report", verifyToken, doctorController.generatePdfReport);

router.get("/get-questions", doctorController.getQuestions);

router.get("/pdf", doctorController.generatePdf);
module.exports = router;
