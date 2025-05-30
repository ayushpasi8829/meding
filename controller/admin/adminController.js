const User = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMessage = require("../../utils/sendMessage");
const Appointment = require("../../models/Appointment");
const moment = require("moment");

exports.doctorList = async (req, res) => {
    try {
      let doctors = await User.find({ role: "doctor" }); 
  
      res.status(200).json({ 
        success: true,
        message: "Doctor List Fetched Successfully",
        data: doctors,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.userList = async (req, res) => {
    try {
      let users = await User.find({ role: "user" }); 
  
      res.status(200).json({ 
        success: true,
        message: "User List Fetched Successfully",
        data: users,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
};
  
exports.SessionStats = async (req, res) => {
  const doctorId = req.user?.id;

  try {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const totalSessions = await Appointment.countDocuments({ doctor: doctorId });
    const completedSessions = await Appointment.countDocuments({ doctor: doctorId, status: 'completed' });
    const cancelledSessions = await Appointment.countDocuments({ doctor: doctorId, status: 'cancelled' });
    const scheduledSessions = await Appointment.countDocuments({ doctor: doctorId, status: 'scheduled' });

    const todaySessions = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' } // Optional: exclude cancelled from today's count
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

exports.sendWhatsAppMessage = async (req, res) => {
    const { phone, message, email } = req.body;  
    const response = await sendMessage(phone, message, email);
    res.status(response.success ? 200 : 500).json(response);
  };