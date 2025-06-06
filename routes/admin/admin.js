const express = require("express");
const doctorController = require("../../controller/admin/adminController");
const { verifyToken, isDoctor, isAdmin, isUser } = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/doctors", verifyToken, isAdmin, doctorController.createDoctor);
router.get("/doctors", verifyToken, isAdmin, doctorController.getDoctors);
router.put("/doctors/:id", verifyToken, isAdmin, doctorController.updateDoctor);
router.delete("/doctors/:id", verifyToken, isAdmin, doctorController.deleteDoctor);

router.post("/users", verifyToken, isAdmin, doctorController.createUser); 
router.get("/users", verifyToken, isAdmin, doctorController.userList);   
router.put("/users/:id", verifyToken, isAdmin, doctorController.updateUser); 
router.delete("/users/:id", verifyToken, isAdmin, doctorController.deleteUser)


router.get("/get/session-stats", verifyToken, isAdmin, doctorController.SessionStats);
router.get("/get/sessions", verifyToken, isAdmin, doctorController.getAllAppointments);
router.get("/get/notification", verifyToken, isAdmin,doctorController.getAdminNotifications);

router.post("/bundle-types", verifyToken, isAdmin, doctorController.createBundleType);
router.get("/bundle-types", verifyToken, isAdmin, doctorController.getAllBundleTypes);
router.get("/bundle-types/:id", verifyToken, isAdmin, doctorController.getBundleTypeById);
router.put("/bundle-types/:id", verifyToken, isAdmin, doctorController.updateBundleType);
router.delete("/bundle-types/:id", verifyToken, isAdmin, doctorController.deleteBundleType);

router.post("/make-admin", verifyToken, isAdmin,doctorController.toggleUserRole);
router.get("/user-activity-summary", verifyToken, isAdmin, doctorController.getUserActivitySummary);

router.post("/add-slot", verifyToken, isAdmin, doctorController.addSlotTemplate);
router.get("/slot-templates", verifyToken, doctorController.getSlotTemplates);

router.post("/send", doctorController.sendWhatsAppMessage);

module.exports = router;
