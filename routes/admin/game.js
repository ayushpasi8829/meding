const express = require("express");
const doctorController = require("../../controller/admin/gameController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/question", verifyToken, doctorController.addQuestion);

module.exports = router;
