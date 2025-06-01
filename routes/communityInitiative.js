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

router.post(
  "/create-grouptherapy",
  verifyToken,
  communityInitiativeController.createGrouptherapySession
);

// GET /api/group-therapy-sessions/current
router.get(
  "/group-therapy-sessions",
  verifyToken,
  communityInitiativeController.getCurrentSession
);

router.post(
  "/register-grouptherapy",
  verifyToken,
  communityInitiativeController.registerForSession
);

//Admin routes
router.get(
  "/get-volunteers",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllVolunteers
);

router.get(
  "/get-All-Org-Camps-requests",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllOrgCampRequests
);

router.get(
  "/get-all-therapyplus-requests",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllTherapyPlusJoins
);

router.get(
  "/get-all-therapyplus-hosts",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllTherapyPlusHosts
);

router.get(
  "/get-all-counselorclub-sessions",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllSessions
);

router.get(
  "/get-couselclub-registration",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllRegistrations
);

router.get(
  "/get-all-couselorclubhost-proposals",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllProposals
);

router.get(
  "/get-not-sure-requests",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllNotSureBookings
);

router.get(
  "/get-grouptherapy-sessions",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllGroupTherapySessions
);

router.get(
  "/get-grouptherapy-registrations",
  verifyToken,
  isAdmin,
  communityInitiativeController.getAllGroupTherapyRegistrations
);
module.exports = router;
