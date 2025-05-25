const User = require("../../models/userModel");
const Appointment = require("../../models/Appointment");
const sendMessage = require("../../utils/sendMessage");
const moment = require("moment");

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
  const { sessionId, meetingLink} = req.body;

  if (!sessionId || !meetingLink ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const session = await Appointment.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.doctor.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Update session
    session.meetLink = meetingLink;
    session.status = 'scheduled';
    await Appointment.save();

    // Get user details for notification
    const user = await User.findById(session.patient);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const fullPhone = `${user.countryCode}${user.mobile}`;
    const message = `Hi ${user.fullname}, your session has been accepted.\nMeeting Link: ${meetingLink}\nTime: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`;

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
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Ensure only the assigned doctor can cancel
    if (session.doctor.toString() !== doctorId) {
      return res.status(403).json({ success: false, message: "Only the assigned doctor can cancel this appointment" });
    }

    // Prevent cancelling completed sessions
    if (session.status === "completed") {
      return res.status(400).json({ success: false, message: "Cannot cancel a completed session" });
    }

    // Mark appointment as cancelled
    session.status = "cancelled";
    await session.save();

    // Notify patient (optional)
    const patient = await User.findById(session.patient);
    if (patient) {
      const fullPhone = `${patient.countryCode}${patient.mobile}`;
      const message = `Hi ${patient.fullname}, your session scheduled on ${new Date(
        session.date
      ).toLocaleDateString()} at ${session.timeSlot.startTime} has been cancelled by the doctor.`;
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
      status: "scheduled"
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
      status: "scheduled"
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