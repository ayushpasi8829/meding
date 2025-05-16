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

router.post("/therapy-flow", verifyToken, isUser, userController.therapyFlow );
router.post("/therapy-general-question", verifyToken, isUser, userController.therapyGeneralQuestions );
router.post("/therapy/step3", verifyToken, isUser, userController.updateStep3TherapyDetails );

//Psychometrics
router.post("/Psychometrics/store", verifyToken, isUser, userController.savePsychometricStep1 );

//CorporateWellness 
router.post("/corporateWellness", verifyToken, isUser, userController.submitCorporateWellness );

//Internship
router.post("/internship", verifyToken, isUser, userController.submitInternshipForm );

router.get(
  "/session/request",
  verifyToken,
  isUser,
  userController.createSessionRequest
);

router.post("/add-plan", planController.addPlan);

router.post("/select-plan", verifyToken, isUser, planController.selectPlan);
router.get("/get-selectedplan", verifyToken, isUser, planController.getSelectedPlan
);

router.get(
  "/get-plans", planController.getAllPlans);
module.exports = router;
