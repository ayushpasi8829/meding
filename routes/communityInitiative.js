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

router.get(
  "/get-sessions",
  verifyToken,
  communityInitiativeController.getActiveSession
);

// (Optional, admin) Create a new session
router.post(
  "/create-sessions",
  verifyToken,
  communityInitiativeController.createSession
);

router.post(
  "/registrations",
  verifyToken,
  communityInitiativeController.register
);

router.post(
  "/submit-proposal",
  verifyToken,
  communityInitiativeController.submitProposal
);

router.get(
  "/get-activesessions",
  verifyToken,
  communityInitiativeController.getActiveSession
);

router.post(
  "/not-sure",
  verifyToken,
  communityInitiativeController.createNotSure
);
module.exports = router;
