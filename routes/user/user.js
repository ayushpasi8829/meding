const express = require("express");
const userController = require("../../controller/user/userController");
const planController = require("../../controller/user/planController");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/category/get",
  verifyToken,
  isUser,
  userController.getTherapyCategories
);
router.post(
  "/category/select",
  verifyToken,
  isUser,
  userController.selectCategory
);

router.get(
  "/session/request",
  verifyToken,
  isUser,
  userController.createSessionRequest
);

router.post("/add-plan", planController.addPlan);

router.post("/select-plan", verifyToken, isUser, planController.selectPlan);
router.get(
  "/get-selectedplan",
  verifyToken,
  isUser,
  planController.getSelectedPlan
);

router.get(
  "/get-plans",

  planController.getAllPlans
);
module.exports = router;
