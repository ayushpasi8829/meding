const express = require("express");
const doctorController = require("../../controller/admin/adminController");
const {
  verifyToken,
  isDoctor,
  isUser,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/doctors", verifyToken, doctorController.createDoctor);
router.get("/doctors", verifyToken, doctorController.getDoctors);
router.put("/doctors/:id", verifyToken, doctorController.updateDoctor);
router.delete("/doctors/:id", verifyToken, doctorController.deleteDoctor);

router.post("/users", verifyToken, doctorController.createUser);
router.get("/users", verifyToken, doctorController.userList);
router.put("/users/:id", verifyToken, doctorController.updateUser);
router.delete("/users/:id", verifyToken, doctorController.deleteUser);

router.get("/get/session-stats", verifyToken, doctorController.SessionStats);
router.post("/send", doctorController.sendWhatsAppMessage);

module.exports = router;
