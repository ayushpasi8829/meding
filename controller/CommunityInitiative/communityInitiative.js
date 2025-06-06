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
const GroupTherapySession = require("../../models/GroupTherapySession");
const GroupTherapyRegistration = require("../../models/GroupTherapyRegistration");
const CommunityEvent = require("../../models/CommunityEvent");
const JoinEvent = require("../../models/JoinEvent");
const mongoose = require("mongoose");

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

const createGrouptherapySession = async (req, res) => {
  try {
    const {
      title,
      description,
      therapist,
      date,
      time,
      mode,
      fee,
      topics,
      zoomLink,
    } = req.body;

    const session = new GroupTherapySession({
      title,
      description,
      therapist,
      date,
      time,
      mode,
      fee,
      topics,
      zoomLink,
    });

    await session.save();
    res.status(201).json({ message: "Session added successfully.", session });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Failed to add session.", details: err.message });
  }
};

const getCurrentSession = async (req, res) => {
  try {
    const now = new Date();
    let session = await GroupTherapySession.findOne({
      date: { $gte: now },
    }).sort({ date: 1 });

    if (!session) {
      session = await GroupTherapySession.findOne().sort({ date: -1 });
    }

    if (!session) {
      return res.status(404).json({ message: "No session found." });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch session." });
  }
};
const registerForSession = async (req, res) => {
  try {
    const { sessionId, name, age, contact, email, profession, specific } =
      req.body;

    // Validate sessionId
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: "A valid sessionId is required." });
    }

    // Find the session by ID
    const session = await GroupTherapySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    const registration = new GroupTherapyRegistration({
      session: session._id,
      name,
      age,
      contact,
      email,
      profession,
      specific,
    });
    await registration.save();

    res.status(201).json({ message: "Registration successful." });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Registration failed.", details: err.message });
  }
};

//get Apis
const paginateResults = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(parseInt(limit));
};

/**
 * Utility function for error responses
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} error - Error object
 */
const errorResponse = (res, statusCode, message, error) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error.message,
  });
};

const getAllVolunteers = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, city, college } = req.query;

    let query = Volunteer.find();

    // Apply filters if provided
    if (name) query = query.where("name", new RegExp(name, "i"));
    if (city) query = query.where("city", new RegExp(city, "i"));
    if (college) query = query.where("college", new RegExp(college, "i"));

    // Get total count for pagination
    const total = await Volunteer.countDocuments(query);

    // Execute query with pagination
    const volunteers = await paginateResults(query, page, limit)
      .populate("user", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: volunteers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve volunteers", error);
  }
};

const getAllOrgCampRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, orgName, city, status } = req.query;

    let query = OrgCampRequest.find();

    // Apply filters if provided
    if (orgName) query = query.where("orgName", new RegExp(orgName, "i"));
    if (city) query = query.where("city", new RegExp(city, "i"));
    if (status) query = query.where("status", status);

    // Get total count for pagination
    const total = await OrgCampRequest.countDocuments(query);

    // Execute query with pagination
    const campRequests = await paginateResults(query, page, limit)
      .populate("user", "email")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: campRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve camp requests", error);
  }
};

const getAllTherapyPlusJoins = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, city, profession } = req.query;

    let query = TherapyPlusJoin.find();

    // Apply filters if provided
    if (name) query = query.where("name", new RegExp(name, "i"));
    if (city) query = query.where("city", new RegExp(city, "i"));
    if (profession)
      query = query.where("profession", new RegExp(profession, "i"));

    // Get total count for pagination
    const total = await TherapyPlusJoin.countDocuments(query);

    // Execute query with pagination
    const joins = await paginateResults(query, page, limit)
      .populate("user", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: joins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(
      res,
      500,
      "Failed to retrieve Therapy Plus join requests",
      error
    );
  }
};

const getAllTherapyPlusHosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      profession,
      sessionType,
      status,
    } = req.query;

    let query = TherapyPlusHost.find();

    // Apply filters if provided
    if (name) query = query.where("name", new RegExp(name, "i"));
    if (profession)
      query = query.where("profession", new RegExp(profession, "i"));
    if (sessionType)
      query = query.where("sessionType", new RegExp(sessionType, "i"));
    if (status) query = query.where("status", status);

    // Get total count for pagination
    const total = await TherapyPlusHost.countDocuments(query);

    // Execute query with pagination
    const hosts = await paginateResults(query, page, limit)
      .populate("user", "email")
      .sort({ preferredDate: 1 });

    res.status(200).json({
      success: true,
      data: hosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(
      res,
      500,
      "Failed to retrieve Therapy Plus host proposals",
      error
    );
  }
};

const getAllSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      title,
      speaker,
      mode,
      upcoming,
      past,
      active,
    } = req.query;

    let query = Session.find();

    // Apply filters if provided
    if (title) query = query.where("title", new RegExp(title, "i"));
    if (speaker) query = query.where("speaker", new RegExp(speaker, "i"));
    if (mode) query = query.where("mode", new RegExp(mode, "i"));

    // Filter by upcoming or past sessions
    const now = new Date();
    if (upcoming === "true") {
      query = query.where("dateTime").gte(now);
    } else if (past === "true") {
      query = query.where("dateTime").lt(now);
    }

    // Filter by active status
    if (active === "true") {
      query = query.where("active", true);
    } else if (active === "false") {
      query = query.where("active", false);
    }

    // Get total count for pagination
    const total = await Session.countDocuments(query);

    // Execute query with pagination
    const sessions = await paginateResults(query, page, limit)
      .populate("createdBy", "email")
      .sort({ dateTime: 1 });

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve sessions", error);
  }
};

const getAllRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      email,
      profession,
      sessionId,
    } = req.query;

    let query = Registration.find();

    // Apply filters if provided
    if (name) query = query.where("name", new RegExp(name, "i"));
    if (email) query = query.where("email", new RegExp(email, "i"));
    if (profession)
      query = query.where("profession", new RegExp(profession, "i"));
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      query = query.where("session", sessionId);
    }

    // Get total count for pagination
    const total = await Registration.countDocuments(query);

    // Execute query with pagination
    const registrations = await paginateResults(query, page, limit)
      .populate("session", "title dateTime")
      .populate("user", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve registrations", error);
  }
};

const getAllProposals = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, email, topic, status } = req.query;

    let query = Proposal.find();

    // Apply filters if provided
    if (name) query = query.where("name", new RegExp(name, "i"));
    if (email) query = query.where("email", new RegExp(email, "i"));
    if (topic) query = query.where("topic", new RegExp(topic, "i"));
    if (status) query = query.where("status", status);

    // Get total count for pagination
    const total = await Proposal.countDocuments(query);

    // Execute query with pagination
    const proposals = await paginateResults(query, page, limit)
      .populate("user", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: proposals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve proposals", error);
  }
};
const getAllNotSureBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, upcoming } = req.query;

    let query = NotSure.find();

    // Apply filters if provided
    if (date) query = query.where("date", date);

    // Filter by upcoming bookings
    const now = new Date();
    if (upcoming === "true") {
      query = query.where("date").gte(now);
    }

    // Get total count for pagination
    const total = await NotSure.countDocuments(query);

    // Execute query with pagination
    const bookings = await paginateResults(query, page, limit)
      .populate("user", "email name")
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve NotSure bookings", error);
  }
};

const getAllGroupTherapySessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      title,
      therapist,
      upcoming,
      past,
    } = req.query;

    let query = GroupTherapySession.find();

    // Apply filters if provided
    if (title) query = query.where("title", new RegExp(title, "i"));
    if (therapist) query = query.where("therapist", new RegExp(therapist, "i"));

    // Filter by upcoming or past sessions
    const now = new Date();
    if (upcoming === "true") {
      query = query.where("date").gte(now);
    } else if (past === "true") {
      query = query.where("date").lt(now);
    }

    // Get total count for pagination
    const total = await GroupTherapySession.countDocuments(query);

    // Execute query with pagination
    const sessions = await paginateResults(query, page, limit).sort({
      date: 1,
      time: 1,
    });

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(res, 500, "Failed to retrieve group therapy sessions", error);
  }
};

const getAllGroupTherapyRegistrations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      email,
      profession,
      sessionId,
    } = req.query;

    let query = GroupTherapyRegistration.find();

    // Apply filters if provided
    if (name) query = query.where("name", new RegExp(name, "i"));
    if (email) query = query.where("email", new RegExp(email, "i"));
    if (profession)
      query = query.where("profession", new RegExp(profession, "i"));
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      query = query.where("session", sessionId);
    }

    // Get total count for pagination
    const total = await GroupTherapyRegistration.countDocuments(query);

    // Execute query with pagination
    const registrations = await paginateResults(query, page, limit)
      .populate("session", "title date time")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    errorResponse(
      res,
      500,
      "Failed to retrieve group therapy registrations",
      error
    );
  }
};

//events-------------------------------------------------

const createEvent = async (req, res) => {
  try {
    const {
      name,
      type,
      topic,
      description,
      date,
      meetingLink,
      status,
      joiningFees,
      "timeSlot.startTime": startTime,
      "timeSlot.endTime": endTime,
    } = req.body;

    // Validation
    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "`type` is required." });
    }
    if (!startTime) {
      return res
        .status(400)
        .json({ success: false, message: "`timeSlot.startTime` is required." });
    }
    if (!endTime) {
      return res
        .status(400)
        .json({ success: false, message: "`timeSlot.endTime` is required." });
    }

    const eventData = {
      name,
      type,
      topic,
      description,
      date,
      meetingLink,
      status,
      joiningFees,
      host: req.user?.id,
      timeSlot: {
        startTime,
        endTime,
      },
    };

    if (req.file) {
      eventData.image = req.file.path;
    }

    const event = await CommunityEvent.create(eventData);
    res
      .status(201)
      .json({ success: true, message: "Event created", data: event });
  } catch (error) {
    console.error("Create Event Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const filter = {};

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const events = await CommunityEvent.find(filter)
      .populate("host", "fullname email")
      .populate("peopleJoined", "fullname email");

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id).populate(
      "host",
      "fullname email"
    );
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params; // Event ID from the URL
    const {
      name,
      type,
      topic,
      description,
      date,
      meetingLink,
      status,
      joiningFees,
      "timeSlot.startTime": startTime,
      "timeSlot.endTime": endTime,
    } = req.body;

    // Validation
    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "`type` is required." });
    }
    if (!startTime) {
      return res
        .status(400)
        .json({ success: false, message: "`timeSlot.startTime` is required." });
    }
    if (!endTime) {
      return res
        .status(400)
        .json({ success: false, message: "`timeSlot.endTime` is required." });
    }

    const eventData = {
      name,
      type,
      topic,
      description,
      date,
      meetingLink,
      status,
      joiningFees,
      timeSlot: {
        startTime,
        endTime,
      },
    };

    if (req.file) {
      eventData.image = req.file.path;
    } else {
      const existingEvent = await CommunityEvent.findById(id);
      if (!existingEvent) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      }
      eventData.image = existingEvent.image;
    }

    const event = await CommunityEvent.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true,
    });

    res
      .status(200)
      .json({ success: true, message: "Event updated", data: event });
  } catch (error) {
    console.error("Update Event Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await CommunityEvent.findByIdAndDelete(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const joinEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await CommunityEvent.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Check if already joined
    const alreadyJoined = await JoinEvent.findOne({
      event: eventId,
      user: userId,
    });
    if (alreadyJoined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You have already joined this event",
        });
    }

    const joinRecord = new JoinEvent({
      event: eventId,
      user: userId,
      eventType: event.type,
      amountPaid: event.joiningFees || 0,
      paymentStatus: "pending",
    });

    await joinRecord.save();

    event.peopleJoined.push(userId);
    await event.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Event joined successfully",
        data: joinRecord,
      });
  } catch (error) {
    console.error("Join event error:", error);
    res.status(500).json({ success: false, message: "Server error" });
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
  createGrouptherapySession,
  getCurrentSession,
  registerForSession,

  getAllVolunteers,
  getAllOrgCampRequests,
  getAllTherapyPlusJoins,
  getAllTherapyPlusHosts,
  getAllSessions,

  getAllRegistrations,
  getAllProposals,
  getAllNotSureBookings,
  getAllGroupTherapySessions,
  getAllGroupTherapyRegistrations,

  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
};
