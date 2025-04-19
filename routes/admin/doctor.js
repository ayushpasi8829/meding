const express = require("express");
const doctorController = require("../../controller/admin/doctorController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/get", verifyToken, isAdmin, doctorController.doctorList);
router.post("/send", doctorController.sendWhatsAppMessage);

module.exports = router;
