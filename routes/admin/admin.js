const express = require("express");
const doctorController = require("../../controller/admin/adminController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/get/doctor", verifyToken, isAdmin, doctorController.doctorList);
router.get("/get/user", verifyToken, isAdmin, doctorController.userList);
router.get("/get/session-stats", verifyToken, isAdmin, doctorController.SessionStats);
router.post("/send", doctorController.sendWhatsAppMessage);

module.exports = router;
