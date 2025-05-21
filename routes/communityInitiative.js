const express = require("express");
const communityInitiativeController = require("../controller/CommunityInitiative/communityInitiative");
const {
  verifyToken,
  isDoctor,
  isAdmin,
  isUser,
} = require("../middleware/authMiddleware");
const router = express.Router();
router.post(
  "/therapyplus/join",
  verifyToken,
  communityInitiativeController.createTherapyPlusJoin
);

router.post(
  "/therapyplus/host",
  verifyToken,
  communityInitiativeController.createTherapyPlusHost
);
router.post(
  "/volunteer",
  verifyToken,
  communityInitiativeController.createVolunteer
);

router.post(
  "/org-camp",
  verifyToken,
  communityInitiativeController.createOrgCampRequest
);

module.exports = router;
