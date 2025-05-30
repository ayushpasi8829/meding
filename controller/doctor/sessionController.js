const User = require("../../models/userModel");
const Appointment = require("../../models/Appointment");
const sendMessage = require("../../utils/sendMessage");
const moment = require("moment");
const cron = require("node-cron");
const DoctorTimeSlot = require("../../models/TimeSlot");
const mongoose = require("mongoose");
exports.getDoctorSessionRequests = async (req, res) => {
  const doctorId = req.user?.id;

  try {
    const sessions = await Appointment.find({ doctor: doctorId })
      .populate("patient", "fullname email mobile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Doctor's session requests fetched",
      data: sessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.acceptSessionRequest = async (req, res) => {
  const doctorId = req.user?.id;
  const { sessionId, meetingLink } = req.body;

  if (!sessionId || !meetingLink) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const session = await Appointment.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    if (session.doctor.toString() !== doctorId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    // Update session
    session.meetLink = meetingLink;
    session.status = "scheduled";
    await session.save();

    // Get user details for notification
    const user = await User.findById(session.patient);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const fullPhone = `${user.countryCode}${user.mobile}`;
    const message = `Hi ${
      user.fullname
    }, your session has been accepted.\nMeeting Link: ${meetingLink}\nTime: ${new Date(
      session.startTime
    ).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}`;

    // Send message (WhatsApp/SMS + Email)
    await sendMessage(fullPhone, message, user.email);

    res.status(200).json({
      success: true,
      message: "Session request accepted and user notified",
      data: session,
    });
  } catch (err) {
    console.error("Accept Session Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.cancelAppointment = async (req, res) => {
  const doctorId = req.user?.id;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "sessionId is required",
    });
  }

  try {
    const session = await Appointment.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Ensure only the assigned doctor can cancel
    if (session.doctor.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can cancel this appointment",
      });
    }

    // Prevent cancelling completed sessions
    if (session.status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel a completed session" });
    }

    // Mark appointment as cancelled
    session.status = "cancelled";
    await session.save();

    // Notify patient (optional)
    const patient = await User.findById(session.patient);
    if (patient) {
      const fullPhone = `${patient.countryCode}${patient.mobile}`;
      const message = `Hi ${
        patient.fullname
      }, your session scheduled on ${new Date(
        session.date
      ).toLocaleDateString()} at ${
        session.timeSlot.startTime
      } has been cancelled by the doctor.`;
      await sendMessage(fullPhone, message, patient.email);
    }

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully by doctor",
      data: session,
    });
  } catch (error) {
    console.error("Doctor cancel appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.completeAppointment = async (req, res) => {
  const doctorId = req.user?.id;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: "sessionId is required",
    });
  }

  try {
    const session = await Appointment.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Ensure only the assigned doctor can cancel
    if (session.doctor.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can complete this appointment",
      });
    }

    session.status = "completed";
    await session.save();

    const patient = await User.findById(session.patient);
    if (patient) {
      const fullPhone = `${patient.countryCode}${patient.mobile}`;
      const message = `Hi ${
        patient.fullname
      }, your session scheduled on ${new Date(
        session.date
      ).toLocaleDateString()} at ${
        session.timeSlot.startTime
      } has been cancelled by the doctor.`;
      await sendMessage(fullPhone, message, patient.email);
    }

    return res.status(200).json({
      success: true,
      message: "Appointment completed successfully by doctor",
      data: session,
    });
  } catch (error) {
    console.error("Doctor cancel appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.addNotesToAppointment = async (req, res) => {
  const doctorId = req.user?.id;
  const { sessionId, notes } = req.body;

  if (!sessionId || !notes?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Both sessionId and notes are required",
    });
  }

  try {
    const session = await Appointment.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Ensure only assigned doctor can add notes
    if (session.doctor.toString() !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can add notes",
      });
    }

    if (session.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Notes can only be added to completed sessions",
      });
    }

    session.notes = notes.trim();
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Notes added successfully",
      data: session,
    });
  } catch (error) {
    console.error("Add notes error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getTodayAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: "scheduled",
    })
      .populate("patient", "fullname email")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching today's appointments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUpcomingAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const now = new Date();

    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gt: now },
      status: "scheduled",
    })
      .populate("patient", "fullname email")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getDoctorSessionStats = async (req, res) => {
  const doctorId = req.user?.id;

  try {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const totalSessions = await Appointment.countDocuments({
      doctor: doctorId,
    });
    const completedSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "completed",
    });
    const cancelledSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "cancelled",
    });
    const scheduledSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "scheduled",
    });

    const todaySessions = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "cancelled" }, // Optional: exclude cancelled from today's count
    });

    res.status(200).json({
      success: true,
      message: "Doctor session statistics fetched successfully",
      data: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        scheduledSessions,
        todaySessions,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor session stats:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

cron.schedule("*/5 * * * *", async () => {
  console.log("Running session reminder check...");

  const now = new Date();
  const thirtyMinutesLater = moment(now).add(30, "minutes").toDate();

  try {
    const upcomingSessions = await Appointment.find({
      status: "scheduled",
      reminderSent: false,
      date: {
        $lte: thirtyMinutesLater,
        $gte: moment(now).add(25, "minutes").toDate(),
      },
    }).populate("patient", "fullname email mobile countryCode");

    for (const session of upcomingSessions) {
      const patient = session.patient;
      if (!patient) continue;

      const fullPhone = `${patient.countryCode}${patient.mobile}`;
      const message = `Hi ${patient.fullname}, this is a reminder that your session is scheduled in 30 minutes.\nMeeting Link: ${session.meetLink}`;

      await sendMessage(fullPhone, message, patient.email);

      session.reminderSent = true;
      await session.save();

      console.log(`Reminder sent to ${patient.fullname}`);
    }
  } catch (error) {
    console.error("Reminder job error:", error);
  }
});

exports.getDoctorsSelectedSlots = async (req, res) => {
  console.log("Fetching doctor's selected slots...");
  try {
    const doctorId = req.user.id;
    // Optional: Validate doctorId is a valid MongoDB ObjectId
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid or missing doctor ID." });
    }

    console.log(`Fetching selected slots for doctor: ${doctorId}`);

    // Query the database for the doctor's slots
    const timeSlots = await DoctorTimeSlot.findOne({ doctor: doctorId })
      .populate("doctor", "name email") // Optional: populate doctor details
      .lean();

    if (!timeSlots) {
      return res
        .status(404)
        .json({ message: "No slots found for this doctor." });
    }

    // Respond with the doctor's selected slots
    return res.status(200).json({
      doctor: timeSlots.doctor,
      slots: timeSlots.slots,
    });
  } catch (error) {
    console.error("Error fetching doctor's slots:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getDoctorSessionStats = async (req, res) => {
  const doctorId = req.user?.id;

  try {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const totalSessions = await Appointment.countDocuments({
      doctor: doctorId,
    });
    const completedSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "completed",
    });
    const cancelledSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "cancelled",
    });
    const scheduledSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "scheduled",
    });

    const todaySessions = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "cancelled" }, // Optional: exclude cancelled from today's count
    });

    res.status(200).json({
      success: true,
      message: "Doctor session statistics fetched successfully",
      data: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        scheduledSessions,
        todaySessions,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor session stats:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
