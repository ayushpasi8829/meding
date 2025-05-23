const Volunteer = require("../../models/volunteer");
const {
  TherapyPlusJoin,
  TherapyPlusHost,
} = require("../../models/TherapyPlus");
const OrgCampRequest = require("../../models/OrgCampRequest");
const Session = require("../../models/Session");
const Registration = require("../../models/Registration");
const Proposal = require("../../models/Proposal");
const NotSure = require("../../models/NotSure");
const createVolunteer = async (req, res) => {
  try {
    const { name, age, city, college, education, why } = req.body;
    const user = req.user?.id;
    const volunteer = new Volunteer({
      user,
      name,
      age,
      city,
      college,
      education,
      why,
    });

    await volunteer.save();

    res.status(201).json({
      success: true,
      message: "Volunteer application received",
      data: volunteer,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createOrgCampRequest = async (req, res) => {
  try {
    const { orgName, city, date, participants, contact } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const campRequest = new OrgCampRequest({
      user,
      orgName,
      city,
      date,
      participants,
      contact,
    });

    await campRequest.save();

    res.status(201).json({
      success: true,
      message: "Camp request submitted successfully",
      data: campRequest,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createTherapyPlusJoin = async (req, res) => {
  console.log("Request body:", req.body); // Log the request body for debugging
  try {
    const { name, phone, email, city, age, profession } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const whatsappLink = "https://chat.whatsapp.com/YourGroupLinkHere"; // You can make this dynamic

    const joinDoc = new TherapyPlusJoin({
      user,
      name,
      phone,
      email,
      city,
      age,
      profession,
      whatsappLink,
    });

    await joinDoc.save();

    res.status(201).json({
      success: true,
      message: "Joined Therapy Plus group successfully.",
      data: joinDoc,
      whatsappLink,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Controller for proposing a Therapy Plus session
const createTherapyPlusHost = async (req, res) => {
  try {
    const {
      name,
      profession,
      sessionType,
      sessionDetails,
      preferredDate,
      experience,
    } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const hostDoc = new TherapyPlusHost({
      user,
      name,
      profession,
      sessionType,
      sessionDetails,
      preferredDate,
      experience,
    });

    await hostDoc.save();

    res.status(201).json({
      success: true,
      message: "Session proposal submitted successfully",
      data: hostDoc,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createSession = async (req, res) => {
  try {
    const { title, speaker, dateTime, mode, fee } = req.body;

    // Optionally, require createdBy from req.user._id
    const createdBy = req.user?.id;

    const session = new Session({
      title,
      speaker,
      dateTime,
      mode,
      fee,
      createdBy,
    });

    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const register = async (req, res) => {
  try {
    const {
      sessionId,
      name,
      age,
      contact,
      email,
      profession,
      experience,
      insights,
    } = req.body;

    // User ID from auth middleware (e.g., req.user._id)
    const userId = req.user.id;

    // Check session existence
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Create registration
    const registration = new Registration({
      session: sessionId,
      name,
      age,
      contact,
      email,
      profession,
      experience,
      insights,
      user: userId,
    });

    await registration.save();
    res.status(201).json({ message: "Registered successfully", registration });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "Already registered for this session" });
    }
    res.status(400).json({ error: err.message });
  }
};

const submitProposal = async (req, res) => {
  try {
    const {
      name,
      email,
      background,
      bio,
      topic,
      hasExperience,
      audience,
      mode,
      preferredDates,
    } = req.body;

    // User ID from auth middleware (e.g., req.user._id)
    const userId = req.user.id;

    const proposal = new Proposal({
      name,
      email,
      background,
      bio,
      topic,
      hasExperience,
      audience,
      mode,
      preferredDates,
      user: userId,
    });

    await proposal.save();
    res.status(201).json({ message: "Proposal submitted", proposal });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await Session.findOne({ active: true });
    if (!session)
      return res.status(404).json({ error: "No active session found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new "NotSure" booking
exports.createNotSure = async (req, res) => {
  try {
    const { userId, concerns, date, timeSlot } = req.body;

    // Optional: Prevent double booking for the same time slot and date
    const existing = await NotSure.findOne({ date, timeSlot });
    if (existing) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked." });
    }

    const newBooking = new NotSure({
      user: userId,
      concerns,
      date,
      timeSlot,
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully.",
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Create a new "NotSure" booking
exports.createNotSure = async (req, res) => {
  try {
    const { userId, concerns, date, timeSlot } = req.body;

    // Optional: Prevent double booking for the same time slot and date
    const existing = await NotSure.findOne({ date, timeSlot });
    if (existing) {
      return res
        .status(409)
        .json({ message: "This time slot is already booked." });
    }

    const newBooking = new NotSure({
      user: userId,
      concerns,
      date,
      timeSlot,
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully.",
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Create a new "NotSure" booking
const createNotSure = async (req, res) => {
  try {
    const { concerns, date, timeSlot } = req.body;
    const userId = req.user.id;

    const newBooking = new NotSure({
      user: userId,
      concerns,
      date,
      timeSlot,
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully.",
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
module.exports = {
  createVolunteer,
  createOrgCampRequest,
  createTherapyPlusJoin,
  createTherapyPlusHost,
  createSession,
  register,
  submitProposal,
  getActiveSession,
  createNotSure,
};
